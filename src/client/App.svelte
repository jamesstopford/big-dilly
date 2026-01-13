<script>
  import { onMount } from 'svelte';
  import { auth, isAuthenticated } from './stores/auth.js';
  import { theme } from './stores/theme.js';
  import { router, currentPath } from './stores/router.js';

  // Pages
  import LoginPage from './pages/LoginPage.svelte';
  import RegisterPage from './pages/RegisterPage.svelte';
  import ForgotPasswordPage from './pages/ForgotPasswordPage.svelte';
  import ResetPasswordPage from './pages/ResetPasswordPage.svelte';
  import MainApp from './pages/MainApp.svelte';

  // Initialize auth on mount
  onMount(async () => {
    await auth.init();

    // If user is logged in, initialize theme from their preferences
    const unsubscribe = auth.subscribe(state => {
      if (state.user && state.user.theme) {
        theme.initFromUser(state.user.theme);
      }
    });

    return () => unsubscribe();
  });

  // Auth routes that don't require login
  const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

  // Redirect logic
  $: {
    if (!$auth.loading) {
      if ($isAuthenticated && authRoutes.includes($currentPath)) {
        // Logged in user on auth page -> redirect to app
        router.replace('/');
      } else if (!$isAuthenticated && !authRoutes.includes($currentPath)) {
        // Not logged in and not on auth page -> redirect to login
        router.replace('/login');
      }
    }
  }
</script>

{#if $auth.loading}
  <div class="loading-screen">
    <div class="spinner"></div>
    <p>Loading...</p>
  </div>
{:else if $isAuthenticated}
  <!-- Main application -->
  <MainApp />
{:else}
  <!-- Auth pages -->
  {#if $currentPath === '/register'}
    <RegisterPage />
  {:else if $currentPath === '/forgot-password'}
    <ForgotPasswordPage />
  {:else if $currentPath === '/reset-password'}
    <ResetPasswordPage />
  {:else}
    <LoginPage />
  {/if}
{/if}

<style>
  .loading-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    gap: 1rem;
    color: var(--text-secondary);
  }
</style>
