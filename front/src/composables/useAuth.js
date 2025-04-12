import { ref } from 'vue'
import { useSettings } from './useSettings'

const token = ref(localStorage.getItem('token'))

export function useAuth() {
  const isLoggedIn = () => !!token.value

  const login = (newToken) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
    useSettings().fetchSettings()
  }

  const logout = () => {
    token.value = null
    localStorage.removeItem('token')
  }


  return {
    token,
    isLoggedIn,
    login,
    logout
  }
}
