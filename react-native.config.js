// React Native autolinking overrides.
//
// react-native-razorpay@2.3.1 is NOT compatible with the New Architecture
// (Fabric / TurboModules). For v1 we ship with newArchEnabled: true so
// Reanimated 4.x compiles correctly (Reanimated 4 is New-Arch-only).
//
// Razorpay JS imports still resolve (the package stays in package.json so
// PaywallScreen.tsx compiles), but the native module is NOT linked into
// the Android build. Calling RazorpayCheckout.open() at runtime would
// throw — but EXPO_PUBLIC_PAYWALL_ENABLED=false in v1 ensures that path
// is never executed.
//
// To re-enable Razorpay in v1.1 (when paywall ships):
//   1. Either upgrade to a Razorpay version with New Arch support, OR
//   2. Replace with a New-Arch-compatible payment SDK, OR
//   3. Set newArchEnabled: false AND downgrade Reanimated to 3.x.
//   4. Then remove the override below.

module.exports = {
  dependencies: {
    'react-native-razorpay': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
};
