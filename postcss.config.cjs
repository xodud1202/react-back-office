// 프로젝트 루트에 postcss.config.cjs (이름 그대로) 생성
module.exports = {
  plugins: [
    // Tailwind CSS v4+ 용 PostCSS 플러그인
    '@tailwindcss/postcss',
    // (v4 에서는 autoprefixer 기능이 내장되어 있지만, 추가하고 싶다면)
    // 'autoprefixer',
  ],
}
