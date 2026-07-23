import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    image?: string;
  }
  
  interface Session {
    user?: {
      id?: string;
      role?: string;
      email?: string;
      name?: string;
      image?: string;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
  }
} 