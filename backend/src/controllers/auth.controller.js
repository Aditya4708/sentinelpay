const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");
const { registerSchema, loginSchema, refreshSchema, updateProfileSchema } = require("../validators/auth.validator");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/jwt");

async function register(req, res) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { name, email, phone, password, upiId, preferredBank, preferredApp } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }, { upiId }] },
  });

  if (existing) {
    return res.status(409).json({ error: "User with this email, phone, or UPI ID already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash, upiId, preferredBank, preferredApp },
  });

  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id, role: user.role });

  return res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, upiId: user.upiId },
    accessToken,
    refreshToken,
  });
}

async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  if (user.isBlocked) {
    return res.status(403).json({ error: "This account has been blocked" });
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id, role: user.role });

  return res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, upiId: user.upiId },
    accessToken,
    refreshToken,
  });
}

async function refresh(req, res) {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const payload = verifyRefreshToken(parsed.data.refreshToken);
    const accessToken = signAccessToken({ userId: payload.userId, role: payload.role });
    return res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
}

async function me(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: {
      id: true, name: true, email: true, phone: true, role: true,
      upiId: true, preferredBank: true, preferredApp: true,
      currentRiskScore: true, createdAt: true,
    },
  });

  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({ user });
}

async function updateMe(req, res) {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const updated = await prisma.user.update({
    where: { id: req.user.userId },
    data: parsed.data,
    select: {
      id: true, name: true, email: true, phone: true, role: true,
      upiId: true, preferredBank: true, preferredApp: true,
      currentRiskScore: true, createdAt: true,
    },
  });

  return res.json({ user: updated });
}

module.exports = { register, login, refresh, me, updateMe };