const baseUrl = import.meta.env.BASE_URL;
const supabaseBase = import.meta.env.VITE_SUPABASE_URL
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/Assets`
    : null;

export const BRAND_ASSETS = {
    logo: supabaseBase ? `${supabaseBase}/favicon.png` : `${baseUrl}branding/logo-mark.svg`,
    loginBackground: supabaseBase ? `${supabaseBase}/login-bg.jpg` : `${baseUrl}branding/login-bg.svg`,
    lost404: supabaseBase ? `${supabaseBase}/lost_404.gif?v=3` : `${baseUrl}branding/lost-404.svg`,
    ogBanner: `${baseUrl}branding/og-banner.svg`,
};

export const DEFAULT_PROJECT_BACKGROUND = `${baseUrl}backgrounds/main-view.svg`;
