import { Router } from "express";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { db, users } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { hashPassword, verifyPassword, createToken } from "../lib/auth";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parseResult = RegisterBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid registration data", details: parseResult.error.flatten() });
    return;
  }

  const { username, email, password } = parseResult.data;

  try {
    const existing = await db
      .select()
      .from(users)
      .where(or(eq(users.username, username), eq(users.email, email.toLowerCase())))
      .limit(1);

    if (existing.length > 0) {
      const match = existing[0];
      if (match.username.toLowerCase() === username.toLowerCase()) {
        res.status(400).json({ error: "Username is already taken" });
        return;
      }
      res.status(400).json({ error: "Email is already registered" });
      return;
    }

    const passwordHash = await hashPassword(password);
    const [newUser] = await db
      .insert(users)
      .values({
        username,
        email: email.toLowerCase(),
        passwordHash,
      })
      .returning();

    const token = createToken({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
    });

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 3600 * 1000,
    });

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to register user");
    res.status(500).json({ error: "Failed to register user" });
  }
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parseResult = LoginBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid login data", details: parseResult.error.flatten() });
    return;
  }

  const { usernameOrEmail, password } = parseResult.data;

  try {
    const isEmail = usernameOrEmail.includes("@");
    const [user] = await db
      .select()
      .from(users)
      .where(
        isEmail
          ? eq(users.email, usernameOrEmail.toLowerCase())
          : eq(users.username, usernameOrEmail)
      )
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    const token = createToken({
      id: user.id,
      username: user.username,
      email: user.email,
    });

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 3600 * 1000,
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to login user");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({
    id: req.user.id,
    username: req.user.username,
    email: req.user.email,
  });
});

router.post("/auth/logout", (_req, res): void => {
  res.clearCookie("auth_token");
  res.json({ success: true });
});

export default router;
