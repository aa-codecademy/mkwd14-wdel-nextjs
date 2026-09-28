// Next.js configuration. Changes here need a restart of `npm run dev`.
// All options: https://nextjs.org/docs/app/api-reference/config/next-config-js
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // React Compiler automatically memoizes components and values, so you rarely
  // need useMemo / useCallback / React.memo by hand. It needs the
  // `babel-plugin-react-compiler` dev dependency (see package.json).
  // https://react.dev/learn/react-compiler
  reactCompiler: true,
};

export default nextConfig;
