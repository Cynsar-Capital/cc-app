import nextAuth, { getServerSession, type NextAuthOptions } from "next-auth";
import EmailProvider  from "next-auth/providers/email";
import  GitHubProvider  from "next-auth/providers/github";
import  GoogleProvider  from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
import { randomUUID } from "crypto";

const VERCEL_DEPLOYMENT = !!process.env.VERCEL_URL;

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.AUTH_GITHUB_ID as string,
      clientSecret: process.env.AUTH_GITHUB_SECRET as string,
      profile(profile: any) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          gh_username: profile.login,
          email: profile.email,
          image: profile.avatar_url,
          role: Role.Indecisive
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      profile(profile: any) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.picture
        };
      }
    }),
    EmailProvider({
      server: {
        host: "smtp.sendgrid.net",
        port: 587,
        auth: {
          user: "apikey", // This is literally the string 'apikey'
          pass: process.env.SENDGRID_API_KEY
        }
      },
      from: process.env.EMAIL_FROM, // The email address to send emails from
    }),
    
  ],
  pages: {
    signIn: `/login`,
    verifyRequest: `/verify-request`,
    newUser: '/signup',
    error: '/login', // Error code passed in query string as ?error=
  },
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  cookies: {
    sessionToken: {
      name: `${VERCEL_DEPLOYMENT ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        // When working on localhost, the cookie domain must be omitted entirely (https://stackoverflow.com/a/1188145)
        domain: VERCEL_DEPLOYMENT
          ? `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
          : undefined,
        secure: VERCEL_DEPLOYMENT,
      },
    },
  },
  callbacks: {
    jwt: async ({ token, user , account, profile, isNewUser}: any) => {
      if (user) {
        token.user = user;
      }
      return token;
    },
    session: async ({ session, token }: any) => {
      session.user = {
        ...session.user,
        // @ts-expect-error
        id: token.sub,
        // @ts-expect-error
        username: token?.user?.username || token?.user?.gh_username,
      };
      return session;
    },
    signIn: async ({ user, account, profile, email, credentials }: any) => {
      
      // get sessions anyways 
      const currentSession = await getSession();
      
      // Check if the email provider is being used
      if (account.provider === 'email') {
        // First part: Handling the verification request
        
        if (email && email.verificationRequest) {
          // Assuming 'email.address' contains the user's email
          const userEmail = user.email;
          // Find the user in the database
          const existingUser = await prisma.user.findUnique({ where: { email: userEmail } });
          // If the user does not exist, create a new user
          if (!existingUser) {
            // Send to Sigup
            const signupUrl = `/signup?email=${encodeURIComponent(userEmail)}`;
            return signupUrl;
          }
    
          // Redirect to the verification request page
          return true;
        }
        // Second part: Handling the post-verification process
        else {
          // 'email' is the user's email address after they clicked the verification link
          const userEmail = user.email || email;
    
          // Find the user in the database
          const verifiedUser = await prisma.user.create({
              data: {
                email: userEmail,
                role: Role.Indecisive,
              },
            });
          // Check if the user has a username, if not redirect to newUser page
          if (verifiedUser && verifiedUser.name == null) {
            return true
          }
    
          // Proceed with the sign-in process for verified users
          return true;
        }
      }
    
      // For other account providers, continue with the default flow
      return true;
    },
    
  },
};

export function getSession() {
  return getServerSession(authOptions) as Promise<{
    user: {
      id: string;
      name: string;
      username: string;
      email: string;
      image: string;
    };
  } | null>;
}

export function withSiteAuth(action: any) {
  return async (
    formData: FormData | null,
    siteId: string,
    key: string | null,
  ) => {
    const session = await getSession();
    if (!session) {
      return {
        error: "Not authenticated",
      };
    }
    const site = await prisma.site.findUnique({
      where: {
        id: siteId,
      },
    });
    if (!site || site.userId !== session.user.id) {
      return {
        error: "Not authorized",
      };
    }

    return action(formData, site, key);
  };
}

export function withPostAuth(action: any) {
  return async (
    formData: FormData | null,
    postId: string,
    key: string | null,
  ) => {
    const session = await getSession();
    if (!session?.user.id) {
      return {
        error: "Not authenticated",
      };
    }
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
      include: {
        site: true,
      },
    });
    if (!post || post.userId !== session.user.id) {
      return {
        error: "Post not found",
      };
    }

    return action(formData, post, key);
  };
}


