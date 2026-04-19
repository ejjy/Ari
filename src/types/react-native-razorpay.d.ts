// Minimal ambient types for react-native-razorpay v2.
// Upstream ships no .d.ts — we only use the open() method so keep the
// surface small and honest about `any` in the option bag.
declare module 'react-native-razorpay' {
  export interface RazorpaySuccessResult {
    razorpay_payment_id: string;
    razorpay_subscription_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  }

  export interface RazorpayError {
    code: number;
    description: string;
    source?: string;
    step?: string;
    reason?: string;
  }

  const RazorpayCheckout: {
    open(options: Record<string, unknown>): Promise<RazorpaySuccessResult>;
  };

  export default RazorpayCheckout;
}
