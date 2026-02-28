"use client"

import { LoginForm } from "@/components/auth/login-form"
import { SignUpForm } from "@/components/auth/signup-form"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/common/tabs"

export function AuthTabs({
  defaultTab = "login",
}: {
  defaultTab?: "login" | "signup"
}) {
  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList className="w-full">
        <TabsTrigger value="login">Sign in</TabsTrigger>
        <TabsTrigger value="signup">Sign up</TabsTrigger>
      </TabsList>
      <TabsContent value="login" className="flex flex-col gap-group pt-group">
        <h1 className="font-serif text-heading">Welcome back</h1>
        <LoginForm />
      </TabsContent>
      <TabsContent value="signup" className="flex flex-col gap-group pt-group">
        <h1 className="font-serif text-heading">Create your account</h1>
        <SignUpForm />
      </TabsContent>
    </Tabs>
  )
}
