import { ref } from 'vue'

const eggs = ref(0)

export function usePlayer() {
  function addEggs(n) {
    eggs.value += n
  }

  function spendEggs(n) {
    if (eggs.value >= n) {
      eggs.value -= n
      return true
    }
    return false
  }

  function setEggs(n) {
    eggs.value = n
  }

  return {
    eggs,
    addEggs,
    spendEggs,
    setEggs
  }
}
