import type { Metadata } from 'next'
import { Archivo, Archivo_Narrow } from 'next/font/google'
import { BarraServicos } from '@/components/layout/BarraServicos'
import { Cabecalho } from '@/components/layout/Cabecalho'
import { RodapeDoMural } from '@/components/layout/RodapeDoMural'
import './globals.css'

const fonteArchivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--fonte-archivo',
  display: 'swap',
})

const fonteArchivoNarrow = Archivo_Narrow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--fonte-archivo-narrow',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Mural da Fatec Campinas',
  description: 'Avisos, eventos e prazos da Fatec Campinas.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fonteArchivo.variable} ${fonteArchivoNarrow.variable}`}>
      <body>
        <a className="pular-para-conteudo" href="#conteudo">Pular para o conteúdo</a>
        <BarraServicos />
        <Cabecalho />
        {children}
        <RodapeDoMural />
      </body>
    </html>
  )
}
