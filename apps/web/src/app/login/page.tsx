import { signIn } from "@/auth";
import { Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-background/95">
            <div className="w-full max-w-md mx-auto p-8">
                <Card className="backdrop-blur-xl shadow-2xl">
                    <CardHeader className="text-center space-y-2 pb-2">
                        <div className="mx-auto flex items-center gap-2">
                            <Clapperboard className="h-7 w-7 text-primary" />
                            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                                RenmaeAI
                            </CardTitle>
                        </div>
                        <CardDescription>
                            AI Video Production Platform
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Google Sign In */}
                        <form
                            action={async () => {
                                "use server";
                                await signIn("google", { redirectTo: "/dashboard" });
                            }}
                        >
                            <Button
                                type="submit"
                                variant="outline"
                                className="w-full h-12 gap-3 text-base font-medium"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                Đăng nhập bằng Google
                            </Button>
                        </form>

                        <p className="text-center text-muted-foreground text-xs">
                            Bạn sẽ được tạo tài khoản tự động khi đăng nhập lần đầu
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
