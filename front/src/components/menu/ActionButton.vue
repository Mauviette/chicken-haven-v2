<template>
    <button
      class="action-button"
      :class="{ active, disabled }"
      @click="!disabled && onClick()"
      :disabled="disabled"
    >
      <slot></slot>
    </button>
  </template>
  
  <script setup>
  defineProps({
    onClick: Function,
    disabled: Boolean,
    active: Boolean
  })
  </script>
  
  <style>
  .action-button {
    background-color: #7a3e10;
    border: 2px solid #ffc66e;
    color: #fff9e5;
    border-radius: 10px;
    padding: 8px 12px;
    font-family: 'Fredoka', sans-serif;
    font-size: 14px;

    transition: transform 0.1s ease;
  }
  
  .action-button:hover:not(.disabled) {
    background-color: #8a4a1c;
    transform: translateY(-1px);
  }
  
  .action-button:active:not(.disabled) {
    transform: translateY(2px);
    box-shadow: 0 0px 0 #5c2c08;
  }
  
  /* État actif visuel */
  .action-button.active {
    background-color: #a05a2d;
    border-color: #ffdb9f;
  }
  
  /* État désactivé */
  .action-button.disabled {
    background-color: #5c2c08;
    color: #bbb;  
    cursor: url('@/assets/ui/cursor/disabled_small.png') 16 16, auto;
    opacity: 0.7;
  }
  </style>
  