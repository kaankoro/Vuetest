<template>
    <div>
      <h1>Sign Up</h1>
      <form @submit.prevent="signup">
        <div>
          <label>Email:</label>
          <input v-model="email" type="email" required />
        </div>
        <div>
          <label>Password:</label>
          <input v-model="password" type="password" required />
        </div>
        <button type="submit">Sign Up</button>
      </form>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import axios from 'axios';
  
  const email = ref('');
  const password = ref('');
  
  const signup = async () => {
    try {
      const response = await axios.post('http://localhost:3000/signup', {
        email: email.value,
        password: password.value,
      });
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  };
  </script>
  