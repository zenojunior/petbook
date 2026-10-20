import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <Logo className="text-lg" />
          <CardTitle>Hello, world</CardTitle>
          <CardDescription>Example screen using the app tokens.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          Colors, radius and fonts come from src/styles/tokens.app.css.
        </CardContent>
        <CardFooter>
          <Button nativeButton={false} render={<Link href="/admin" />}>
            See the admin theme
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
