import { ref } from 'vue'

const token = ref(localStorage.getItem('token'))

export function useAuth() {
  const isLoggedIn = () => !!token.value

  const login = (newToken) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
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
