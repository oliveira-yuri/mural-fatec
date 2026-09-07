import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Decisão registrada em código, e não deixada como quatro avisos
    // permanentes na saída do lint: os componentes do mural usam <img>, e não
    // next/image, de propósito. next/image exige um provedor de imagem
    // definido (o Supabase Storage é do Plano 2) e cobra otimização por
    // imagem servida; hoje as imagens do mural são poucas e vêm de URL fixa,
    // então a troca custaria dinheiro e configuração sem entregar nada.
    // Revisar quando entrarem fotos reais do campus (spec §16.4) e houver um
    // provedor escolhido. Lint com aviso permanente treina a equipe a ignorar
    // a saída do lint, que é o custo que estamos evitando aqui.
    files: ["src/components/mural/*.tsx"],
    rules: { "@next/next/no-img-element": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
