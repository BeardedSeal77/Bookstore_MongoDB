'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface User {
  CustomerID: number
  CustomerName: string
  CustomerEmail: string
}

// 👇 Fixed navigation items with proper URLs and display names
const NAV_ITEMS = [
  { key: 'home', url: '/', displayName: 'Home' },
  { key: 'view-orders', url: '/view-orders', displayName: 'View Orders' },
  { key: 'new-order', url: '/new-order', displayName: 'New Order' }
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setCurrentUser(data.user)
        }
      })
      .catch(err => console.error('Failed to fetch session:', err))

    // Find which nav item matches the current pathname
    const matchedItem = NAV_ITEMS.find(item => 
      pathname === item.url || (item.url !== '/' && pathname?.startsWith(item.url))
    )

    if (matchedItem) {
      setActiveSection(matchedItem.key)
    } else if (pathname === '/') {
      setActiveSection('home')
    }
  }, [pathname])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setCurrentUser(null)
    window.location.href = '/login'
  }

  const handleNavClick = (item: typeof NAV_ITEMS[0]) => {
    router.push(item.url)
    setActiveSection(item.key)
  }

  return (
    <div className="sticky top-0 z-50">
      <div className="relative">
        <div className="bg-base rounded-b-lg relative z-20 shadow-md">
          <div className="flex justify-between items-center px-6 py-4">
            <div className="flex space-x-4">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item)}
                  className={`px-4 py-2 rounded-xl transition-colors ${
                    activeSection === item.key ? 'bg-gold/30' : 'hover:bg-overlay'
                  }`}
                >
                  {item.displayName}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              {currentUser ? (
                <>
                  <span className="text-sm text-text">
                    <strong>{currentUser.CustomerName}</strong>
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-xl bg-overlay text-base hover:bg-gold transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl bg-green text-base hover:bg-gold transition-colors"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}