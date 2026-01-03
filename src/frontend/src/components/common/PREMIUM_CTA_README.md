# Premium Upgrade CTA Components

This folder contains elegant, minimalist components designed to encourage users to upgrade to Premium accounts.

## Components

### 1. PremiumUpgradeCTA

A versatile CTA component with 4 different variants to fit any context.

#### Variants:

**`banner`** - Slim horizontal banner

```jsx
import PremiumUpgradeCTA from "../components/common/PremiumUpgradeCTA";

<PremiumUpgradeCTA variant="banner" showClose={true} onClose={() => {}} />;
```

- Best for: Top of pages, inline notifications
- Features: Compact design, clear benefits, upgrade button

**`card`** - Feature-rich card (Default)

```jsx
<PremiumUpgradeCTA variant="card" />
```

- Best for: Main content areas, dedicated sections
- Features: Full feature list, animated elements, pricing hint
- Most visually engaging variant

**`floating`** - Fixed position floating card

```jsx
<PremiumUpgradeCTA
  variant="floating"
  showClose={true}
  onClose={() => setShow(false)}
/>
```

- Best for: Non-intrusive persistent reminder
- Features: Fixed bottom-right position, dismissible
- Appears above other content (z-index: 40)

**`minimal`** - Compact inline button

```jsx
<PremiumUpgradeCTA variant="minimal" className="my-4" />
```

- Best for: Inline with text, subtle prompts
- Features: Small footprint, hover animations
- Can be used within sentences or UI elements

#### Props:

- `variant`: 'banner' | 'card' | 'floating' | 'minimal' (default: 'card')
- `onClose`: Function to call when close button is clicked
- `showClose`: Boolean to show/hide close button (default: false)
- `className`: Additional CSS classes

---

### 2. TokenLimitModal

A modal that appears when users run out of tokens or are running low.

```jsx
import TokenLimitModal from "../components/common/TokenLimitModal";

const [showModal, setShowModal] = useState(false);

<TokenLimitModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  tokensRemaining={25}
/>;
```

#### Props:

- `isOpen`: Boolean to control modal visibility
- `onClose`: Function to call when modal is closed
- `tokensRemaining`: Number of tokens left (0 = out of tokens)

#### Features:

- Dynamic messaging based on token count
- Shows different states: "Out of Tokens" vs "Low Tokens"
- Full premium benefits list
- Animated entry/exit
- Backdrop blur effect
- Direct navigation to pricing page

---

## Usage Examples

### Example 1: Show CTA to non-premium users on AI Tools page

```jsx
import { useAuthContext } from "../context/AuthContext";
import PremiumUpgradeCTA from "../components/common/PremiumUpgradeCTA";

const MyPage = () => {
  const { user } = useAuthContext();
  const isPremium = Boolean(user?.isPremium || user?.premium);

  return (
    <div>
      {/* Your content */}

      {!isPremium && <PremiumUpgradeCTA variant="card" />}
    </div>
  );
};
```

### Example 2: Dismissible floating CTA

```jsx
const [showFloatingCTA, setShowFloatingCTA] = useState(true);

{
  showFloatingCTA && !isPremium && (
    <PremiumUpgradeCTA
      variant="floating"
      showClose={true}
      onClose={() => {
        setShowFloatingCTA(false);
        localStorage.setItem("dismissedCTA", Date.now());
      }}
    />
  );
}
```

### Example 3: Token limit detection

```jsx
import TokenLimitModal from "../components/common/TokenLimitModal";

const MyComponent = () => {
  const [showTokenModal, setShowTokenModal] = useState(false);
  const userTokens = user?.tokens || 0;

  // Check tokens after API call
  useEffect(() => {
    if (userTokens <= 50 && !isPremium) {
      setShowTokenModal(true);
    }
  }, [userTokens]);

  return (
    <>
      {/* Your content */}

      <TokenLimitModal
        isOpen={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        tokensRemaining={userTokens}
      />
    </>
  );
};
```

---

## Design Features

All components include:

- ✨ Full dark mode support
- 🎨 Smooth animations and transitions
- 📱 Responsive design
- ♿ Accessibility features (aria-labels)
- 🎯 Consistent with app's minimalist, elegant design
- ⚡ Optimized performance
- 🎭 Hover and active states
- 🌈 Gradient accents and glow effects

---

## Customization

You can customize appearance with the `className` prop:

```jsx
<PremiumUpgradeCTA variant="banner" className="mb-6 mx-auto max-w-4xl" />
```

---

## Best Practices

1. **Don't show to premium users**: Always check user status before displaying
2. **Strategic placement**: Show CTAs where users are most likely to need premium features
3. **Dismissible options**: For floating/persistent CTAs, allow users to close them
4. **Timing**: Show token modals immediately when limits are hit
5. **Frequency**: Don't spam users - use localStorage to track dismissals
6. **Context**: Use appropriate variants based on page layout and user flow

---

## Strategic Placement Ideas

- **AI Tools page**: Card variant after tool grid
- **Image generation**: Token modal when limit reached
- **Gallery view**: Minimal variant in toolbar
- **Dashboard**: Banner variant at top
- **Profile settings**: Card variant in sidebar
- **Chat interface**: Floating variant (dismissible)
