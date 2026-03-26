import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // 사용자 rules 추가
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // app/layout.tsx 는 루트 레이아웃으로서 공용 벤더 CSS를 link 태그로 직접 로드하는 유일한 진입점입니다.
  // /public 경로의 정적 자산은 Next.js 번들러가 처리할 수 없으므로, 해당 파일에 한해 no-css-tags 규칙을 비활성화합니다.
  {
    files: ["app/layout.tsx"],
    rules: {
      "@next/next/no-css-tags": "off",
    },
  },
];

export default eslintConfig;
