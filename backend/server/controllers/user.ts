import { Signup, Signin } from "@xl-trading/common";
import type { Request, Response } from "express";
import prisma from "@xl-trading/db";
import bcrypt from "bcryptjs";
import Jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedBody = Signup.safeParse(req.body);

    if (!parsedBody.success) {
      res.status(400).json({
        message: "Input validation failed, check credentials",
        error: parsedBody.error.issues,
      });
      return;
    }

    const newUser = parsedBody.data;

    if (!newUser) {
      res.status(400).json({
        message: "Details are not enough",
      });
      return;
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        email: parsedBody.data.email,
      },
    });

    if (existingUser) {
      res.status(400).json({
        message: "User already exists",
      });
      return;
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newUser.password, saltRounds);

    const user = await prisma.user.create({
      data: {
        email: newUser.email,
        name: newUser.name,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    const token = Jwt.sign({ id: user.id }, JWT_SECRET!);

    res.status(200).json({
      message: "signed up successfully",
      token,
      user,
    });
  } catch (error: any) {
    console.log("SIGN UP ERROR: ", error.message);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const signin = async (req: Request, res: Response) => {
  try {
    const parsedBody = Signin.safeParse(req.body);

    if (!parsedBody.success) {
      res.status(400).json({
        message: "Input validations failed",
        error: parsedBody.error.issues,
      });
      return;
    }

    const user = parsedBody.data;

    const existingUser = await prisma.user.findFirst({
      where: {
        email: user.email,
      },
    });

    if (!existingUser) {
      res.status(400).json({
        message: "User does not exist with given email",
      });
      return;
    }

    const comparedPassword = await bcrypt.compare(
      user.password,
      existingUser.password
    );

    if (!comparedPassword) {
      res.status(400).json({
        message: "Passwords dont match",
      });
      return;
    }

    const token = Jwt.sign({ id: existingUser.id }, JWT_SECRET!);

    res.status(200).json({
      message: "Signed in successfully",
      token,
      user: {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
      },
    });
  } catch (error: any) {
    console.log("SIGN IN ERROR: ", error.message);
    res.status(500).json({
      message: "Internale server error",
      error: error.message,
    });
  }
};
