// src/app/page.tsx
import Header from '@/components/Header'

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-grow">
        <div className="p-8 text-center text-xl font-heading text-primary-800">
          Welcome to Bliss Hair Studio
        </div>
      </main>
    </>
  )
}
