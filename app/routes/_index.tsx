import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [{ title: "Trellix Replicache, a Replicache Demo" }];
};

export default function Index() {
  return (
    <div className="h-full flex flex-col items-center pt-20 bg-slate-900">
      <Link to="/about">About</Link>
      <div className="space-y-4 max-w-md text-lg text-slate-300">
        <p>
          This is a demo app to show off the features of Replicache to compare
          them with those of vanilla Remix and React Query.{" "}
          <a
            href="https://twitter.com/thdxr/status/1767247870271295497"
            className="underline"
          >
            More context on Twitter
          </a>
          .
        </p>
        <p>
          It's a recreation of the popular drag and drop interface in{" "}
          <a href="https://trello.com" className="underline">
            Trello
          </a>{" "}
          and other similar apps.
        </p>
        <p>If you want to play around, click sign up!</p>
      </div>
      <div className="flex w-full justify-evenly max-w-md mt-8 rounded-3xl p-10 bg-slate-800">
        <Link
          to="/signup"
          className="text-xl font-medium text-brand-aqua underline"
        >
          Sign up
        </Link>
        <div className="h-full border-r border-slate-500" />
        <Link
          to="/login"
          className="text-xl font-medium text-brand-aqua underline"
        >
          Login
        </Link>
      </div>
    </div>
  );
}
