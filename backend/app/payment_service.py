import time
import random

class PaymentProvider:
    def create_order(self, amount: int, currency: str = "INR") -> dict:
        return {
            "id": f"order_demo_{int(time.time())}{random.randint(10, 99)}",
            "amount": amount,
            "currency": currency,
            "provider": "demo_upi_sandbox"
        }

    def verify_payment(self, payload: dict) -> bool:
        # 90% success, 10% failure randomly chosen
        return random.random() < 0.90

def get_payment_provider() -> PaymentProvider:
    return PaymentProvider()
