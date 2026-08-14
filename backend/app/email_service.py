import os
import smtplib
from pathlib import Path
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL") or os.getenv("EMAIL_FROM") or SMTP_USERNAME
AUTH_EMAIL_DEV_MODE = os.getenv("AUTH_EMAIL_DEV_MODE", "false").lower() == "true"
AUTH_EMAIL_DEV_OUTBOX = os.getenv("AUTH_EMAIL_DEV_OUTBOX", "auth-email-outbox.log")


def _write_dev_email(to_email: str, subject: str, body: str):
    outbox_path = Path(AUTH_EMAIL_DEV_OUTBOX)
    outbox_path.parent.mkdir(parents=True, exist_ok=True)
    with outbox_path.open("a", encoding="utf-8") as outbox:
        outbox.write("\n" + "=" * 80 + "\n")
        outbox.write(f"To: {to_email}\nSubject: {subject}\n\n{body}\n")


def _send_email(to_email: str, subject: str, html_body: str, text_body: str = ""):
    """Send an email using SMTP. Returns True on success, False on failure."""
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        if AUTH_EMAIL_DEV_MODE:
            _write_dev_email(to_email, subject, text_body or html_body)
            print(f"[EMAIL SERVICE] SMTP not configured. Auth email written to {AUTH_EMAIL_DEV_OUTBOX}.")
            return True
        print("[EMAIL SERVICE] SMTP is not configured. Enable AUTH_EMAIL_DEV_MODE for local OTP testing.")
        return False

    msg = MIMEMultipart("alternative")
    msg["From"] = SMTP_FROM_EMAIL
    msg["To"] = to_email
    msg["Subject"] = subject

    if text_body:
        msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM_EMAIL, to_email, msg.as_string())
        print(f"[EMAIL SERVICE] Email sent successfully to {to_email}")
        return True
    except Exception as e:
        print(f"[EMAIL SERVICE] Failed to send email to {to_email}: {e}")
        return False


def send_verification_otp(to_email: str, otp: str, name: str = ""):
    """Send an email verification OTP."""
    subject = "TeamPulse — Verify Your Email"
    greeting = f"Hi {name}," if name else "Hi,"

    html_body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 32px; background: #ffffff; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 24px; font-weight: 700; color: #0f172a; margin: 0;">TeamPulse</h1>
        <p style="font-size: 14px; color: #64748b; margin-top: 4px;">Email Verification</p>
      </div>
      <p style="font-size: 15px; color: #334155; line-height: 1.6;">{greeting}</p>
      <p style="font-size: 15px; color: #334155; line-height: 1.6;">
        Use the verification code below to complete your registration:
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <div style="display: inline-block; background: #f1f5f9; border: 2px solid #e2e8f0; border-radius: 12px; padding: 16px 40px; letter-spacing: 10px; font-size: 32px; font-weight: 800; color: #0f172a;">
          {otp}
        </div>
      </div>
      <p style="font-size: 13px; color: #94a3b8; text-align: center;">
        This code expires in <strong>5 minutes</strong>. Do not share it with anyone.
      </p>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 32px 0;" />
      <p style="font-size: 12px; color: #cbd5e1; text-align: center;">
        If you didn't create a TeamPulse account, you can safely ignore this email.
      </p>
    </div>
    """

    text_body = f"{greeting}\n\nYour TeamPulse verification code is: {otp}\n\nThis code expires in 5 minutes.\n\nIf you didn't request this, please ignore this email."

    return _send_email(to_email, subject, html_body, text_body)


def send_password_reset_otp(to_email: str, otp: str, name: str = ""):
    """Send a password reset OTP."""
    subject = "TeamPulse — Password Reset Code"
    greeting = f"Hi {name}," if name else "Hi,"

    html_body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 32px; background: #ffffff; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 24px; font-weight: 700; color: #0f172a; margin: 0;">TeamPulse</h1>
        <p style="font-size: 14px; color: #64748b; margin-top: 4px;">Password Reset</p>
      </div>
      <p style="font-size: 15px; color: #334155; line-height: 1.6;">{greeting}</p>
      <p style="font-size: 15px; color: #334155; line-height: 1.6;">
        We received a request to reset your password. Use this code:
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <div style="display: inline-block; background: #fef2f2; border: 2px solid #fecaca; border-radius: 12px; padding: 16px 40px; letter-spacing: 10px; font-size: 32px; font-weight: 800; color: #991b1b;">
          {otp}
        </div>
      </div>
      <p style="font-size: 13px; color: #94a3b8; text-align: center;">
        This code expires in <strong>5 minutes</strong>. Do not share it with anyone.
      </p>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 32px 0;" />
      <p style="font-size: 12px; color: #cbd5e1; text-align: center;">
        If you didn't request a password reset, you can safely ignore this email.
      </p>
    </div>
    """

    text_body = f"{greeting}\n\nYour TeamPulse password reset code is: {otp}\n\nThis code expires in 5 minutes.\n\nIf you didn't request this, please ignore this email."

    return _send_email(to_email, subject, html_body, text_body)
