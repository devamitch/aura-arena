/** @type {import('tailwindcss').Config} */
import tailwindAnimate from 'tailwindcss-animate';
export default {
  darkMode:['class'],
  content:['./index.html','./src/**/*.{ts,tsx}'],
  theme:{
    extend:{
      fontFamily:{
        sans:   ["'DM Sans'",  'system-ui', 'sans-serif'],
        display:["'Syne'",     'system-ui', 'sans-serif'],
        mono:   ["'Space Mono'",'monospace'],
      },
      colors:{
        void:'#040610',
        s0:'#06080f',s1:'#0a0c1a',s2:'#0f1122',s3:'#161829',s4:'#1d2038',
        b0:'#151829',b1:'#1c2040',b2:'#252a4c',b3:'#303660',
        t1:'#edf0ff',t2:'#8890b8',t3:'#454b70',t4:'#252840',
        ac:'#00dfff', 'ac2':'#006eff',
        /* discipline */
        boxing:'#ff5722', dance:'#d946ef', yoga:'#10b981',
        martialarts:'#ef4444', gymnastics:'#f43f5e', fitness:'#3b82f6',
        bodybuilding:'#f59e0b', parkour:'#84cc16', calisthenics:'#06b6d4', pilates:'#ec4899',
        /* tiers */
        bronze:'#cd7f32',silver:'#9ba8b5',gold:'#fbbf24',plat:'#38bdf8',champ:'#a78bfa',elite:'#f43f5e',
        /* shadcn compat */
        border:'hsl(var(--border))',input:'hsl(var(--input))',ring:'hsl(var(--ring))',
        background:'hsl(var(--background))',foreground:'hsl(var(--foreground))',
        primary:{DEFAULT:'hsl(var(--primary))',foreground:'hsl(var(--primary-foreground))'},
        secondary:{DEFAULT:'hsl(var(--secondary))',foreground:'hsl(var(--secondary-foreground))'},
        destructive:{DEFAULT:'hsl(var(--destructive))',foreground:'hsl(var(--destructive-foreground))'},
        muted:{DEFAULT:'hsl(var(--muted))',foreground:'hsl(var(--muted-foreground))'},
        card:{DEFAULT:'hsl(var(--card))',foreground:'hsl(var(--card-foreground))'},
        popover:{DEFAULT:'hsl(var(--popover))',foreground:'hsl(var(--popover-foreground))'},
        accent:{DEFAULT:'hsl(var(--accent))',foreground:'hsl(var(--accent-foreground))'},
      },
      borderRadius:{
        '4xl':'2rem','5xl':'2.5rem',
        lg:'var(--radius)',md:'calc(var(--radius) - 2px)',sm:'calc(var(--radius) - 4px)',
      },
      spacing:{ 'nav-h':'62px','safe-b':'env(safe-area-inset-bottom,0px)' },
      animation:{
        'orb-drift':  'orb-drift 12s ease-in-out infinite',
        'shimmer':    'shimmer 1.7s linear infinite',
        'combo-pop':  'combo-pop .38s cubic-bezier(.175,.885,.32,1.275) both',
        'score-tick': 'score-tick .22s cubic-bezier(.16,1,.3,1) both',
        'float':      'float 6s ease-in-out infinite',
        'live-pulse': 'live-pulse 1.3s ease-in-out infinite',
        'fade-up':    'fade-up .35s cubic-bezier(.16,1,.3,1) both',
        'tier-burst': 'tier-burst .6s cubic-bezier(.175,.885,.32,1.275) both',
        'ring-expand':'ring-expand .7s ease-out both',
        'accordion-down':'accordion-down 0.2s ease-out',
        'accordion-up':  'accordion-up 0.2s ease-out',
      },
      boxShadow:{
        'glow':'0 0 20px currentColor',
        'card':'0 4px 28px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.04)',
        'sheet':'0 -24px 60px rgba(0,0,0,.72)',
        'hud':'0 0 0 1px rgba(0,223,255,.13), 0 4px 24px rgba(0,0,0,.6)',
      },
      zIndex:{nav:50,sheet:60,modal:70,toast:80,overlay:90},
      backdropBlur:{xl2:'28px'},
      transitionTimingFunction:{
        spring:'cubic-bezier(.175,.885,.32,1.275)',
        smooth:'cubic-bezier(.16,1,.3,1)',
      },
    },
  },
  plugins:[tailwindAnimate],
};
