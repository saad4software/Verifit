import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  profileUpdateSchema,
  passwordUpdateSchema,
} from "@/modules/auth/schemas";

describe("Auth Zod Validation Schemas", () => {
  describe("loginSchema", () => {
    it("fails when email is invalid", () => {
      const result = loginSchema.safeParse({
        email: "not-an-email",
        password: "secretpassword",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Please enter a valid email address."
        );
      }
    });

    it("fails when password is empty", () => {
      const result = loginSchema.safeParse({
        email: "alex@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Please enter your password."
        );
      }
    });

    it("passes with valid credentials", () => {
      const result = loginSchema.safeParse({
        email: "alex@example.com",
        password: "secretpassword",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("registerSchema", () => {
    it("fails when name is missing", () => {
      const result = registerSchema.safeParse({
        name: "   ",
        email: "alex@example.com",
        password: "password123",
        confirmPassword: "password123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Please enter your full name."
        );
      }
    });

    it("fails when password is less than 8 characters", () => {
      const result = registerSchema.safeParse({
        name: "Alex",
        email: "alex@example.com",
        password: "short",
        confirmPassword: "short",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Password must be at least 8 characters long."
        );
      }
    });

    it("fails when passwords do not match", () => {
      const result = registerSchema.safeParse({
        name: "Alex",
        email: "alex@example.com",
        password: "password123",
        confirmPassword: "password456",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Passwords do not match."
        );
      }
    });

    it("passes with valid inputs", () => {
      const result = registerSchema.safeParse({
        name: "Alex Mercer",
        email: "alex@example.com",
        password: "password123",
        confirmPassword: "password123",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("profileUpdateSchema", () => {
    it("fails when name is empty", () => {
      const result = profileUpdateSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });

    it("fails when avatar image is invalid URL", () => {
      const result = profileUpdateSchema.safeParse({
        name: "Alex",
        image: "not-a-url",
      });
      expect(result.success).toBe(false);
    });

    it("passes with valid name and empty or valid image URL", () => {
      const result = profileUpdateSchema.safeParse({
        name: "Alex",
        image: "https://example.com/pic.png",
      });
      expect(result.success).toBe(true);

      const resultEmptyImage = profileUpdateSchema.safeParse({
        name: "Alex",
        image: "",
      });
      expect(resultEmptyImage.success).toBe(true);
    });
  });

  describe("passwordUpdateSchema", () => {
    it("fails when current password is missing", () => {
      const result = passwordUpdateSchema.safeParse({
        currentPassword: "",
        newPassword: "newpassword123",
        confirmPassword: "newpassword123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Please enter your current password."
        );
      }
    });

    it("fails when passwords do not match", () => {
      const result = passwordUpdateSchema.safeParse({
        currentPassword: "oldpassword",
        newPassword: "newpassword123",
        confirmPassword: "mismatchedpass",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "New passwords do not match."
        );
      }
    });

    it("passes with valid passwords", () => {
      const result = passwordUpdateSchema.safeParse({
        currentPassword: "oldpassword",
        newPassword: "newpassword123",
        confirmPassword: "newpassword123",
      });
      expect(result.success).toBe(true);
    });
  });
});
