import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    image?: string;
    isAdmin?: boolean;
  }
  
  interface Session {
    user?: {
      id?: string;
      role?: string;
      email?: string;
      name?: string;
      image?: string;
      isAdmin?: boolean;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    isAdmin?: boolean;
  }
} 