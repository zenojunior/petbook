import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminHome() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Hello, admin</CardTitle>
          <CardDescription>The same Card and Button, with the admin tokens.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          Colors, radius and fonts come from styles/tokens.admin.css.
        </CardContent>
        <CardFooter>
          <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
            Back to the app
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
