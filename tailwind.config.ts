import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			'primary-dark': 'var(--color-primary-dark)',
  			'primary-navy': 'var(--color-primary-navy)',
  			'primary-slate': 'var(--color-primary-slate)',
  			'primary-light': 'var(--color-primary-light)',
  			'accent-teal': 'var(--color-accent-teal)',
  			'accent-teal-dark': 'var(--color-accent-teal-dark)',
  			'accent-orange': 'var(--color-accent-orange)',
  			'accent-orange-dark': '#E85D04',
  			'text-primary': 'var(--color-text-primary)',
  			'text-secondary': 'var(--color-text-secondary)',
  			'text-muted': 'var(--color-text-muted)',
  			success: '#10B981',
  			warning: '#F59E0B',
  			error: '#EF4444',
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			xl: '16px',
  			'2xl': '24px',
  			'4xl': '24px',
  		},
  		boxShadow: {
  			'glow-teal': '0 0 20px rgba(0,180,216,0.3), 0 0 40px rgba(0,180,216,0.1)',
  			'glow-orange': '0 0 20px rgba(255,107,53,0.3), 0 0 40px rgba(255,107,53,0.1)',
  			'ds-sm': '0 1px 2px rgba(0,0,0,0.3)',
  			'ds-md': '0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.3)',
  			'ds-lg': '0 10px 15px -3px rgba(0,0,0,0.5), 0 4px 6px -4px rgba(0,0,0,0.3)',
  		},
  		fontSize: {
  			hero: ['64px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' }],
  			'hero-mobile': ['40px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' }],
  			stat: ['56px', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '800' }],
  			'stat-mobile': ['36px', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '800' }],
  		},
  		spacing: {
  			'18': '72px',
  		},
  		transitionTimingFunction: {
  			'ds-default': 'cubic-bezier(0.4, 0, 0.2, 1)',
  			'ds-out': 'cubic-bezier(0, 0, 0.2, 1)',
  			'ds-bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  		},
  		backgroundImage: {
  			'hero-gradient': 'var(--hero-gradient)',
  			'accent-gradient': 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
  			'cta-gradient': 'linear-gradient(135deg, #FF6B35 0%, #E85D04 100%)',
  			'category-gradient': 'var(--category-gradient)',
  		},
  		animation: {
  			'float': 'float 4s ease-in-out infinite',
  			'pulse-glow': 'pulse-glow 2.5s ease-in-out infinite',
  			'sonar': 'sonar 2.5s ease-out infinite',
  			'marquee': 'marquee 25s linear infinite',
  			'scan': 'scan 2.5s ease-in-out infinite',
  			'grid-breathe': 'grid-breathe 6s ease-in-out infinite',
  			'mesh-1': 'mesh-float-1 12s ease-in-out infinite',
  			'mesh-2': 'mesh-float-2 14s ease-in-out infinite',
  			'mesh-3': 'mesh-float-3 16s ease-in-out infinite',
  			'gradient-rotate': 'gradient-rotate 3s linear infinite',
  		},
  		keyframes: {
  			float: {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-12px)' },
  			},
  			'pulse-glow': {
  				'0%, 100%': { boxShadow: '0 0 0px rgba(0,180,216,0)' },
  				'50%': { boxShadow: '0 0 20px rgba(0,180,216,0.3)' },
  			},
  			'sonar': {
  				'0%': { transform: 'scale(0.9)', opacity: '0.5' },
  				'100%': { transform: 'scale(1.4)', opacity: '0' },
  			},
  			marquee: {
  				'0%': { transform: 'translateX(0)' },
  				'100%': { transform: 'translateX(-50%)' },
  			},
  			scan: {
  				'0%, 100%': { top: '0', opacity: '0' },
  				'10%': { opacity: '0.6' },
  				'50%': { top: '100%' },
  				'90%': { opacity: '0.6' },
  			},
  			'grid-breathe': {
  				'0%, 100%': { opacity: '0.4' },
  				'50%': { opacity: '0.7' },
  			},
  			'mesh-float-1': {
  				'0%, 100%': { transform: 'translate(0, 0) scale(1)' },
  				'33%': { transform: 'translate(80px, 60px) scale(1.1)' },
  				'66%': { transform: 'translate(-40px, 100px) scale(0.95)' },
  			},
  			'mesh-float-2': {
  				'0%, 100%': { transform: 'translate(0, 0) scale(1)' },
  				'33%': { transform: 'translate(-60px, -80px) scale(1.05)' },
  				'66%': { transform: 'translate(40px, -40px) scale(0.9)' },
  			},
  			'mesh-float-3': {
  				'0%, 100%': { transform: 'translate(-50%, 0) scale(1)' },
  				'33%': { transform: 'translate(-30%, 50px) scale(1.08)' },
  				'66%': { transform: 'translate(-70%, -30px) scale(0.92)' },
  			},
  			'gradient-rotate': {
  				to: { '--gradient-angle': '360deg' },
  			},
  		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
