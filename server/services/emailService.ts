import nodemailer from "nodemailer";

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private fromEmail: string;
  private businessEmail: string;

  constructor() {
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@sheridanjobs.com';
    this.businessEmail = process.env.BUSINESS_EMAIL || 'stonecoaststudios@protonmail.com';
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Only initialize if all required environment variables are present
    if (!process.env.MAILGUN_SMTP_SERVER || !process.env.MAILGUN_SMTP_LOGIN || !process.env.MAILGUN_SMTP_PASSWORD) {
      console.log('Email service not configured. Missing Mailgun SMTP credentials.');
      return;
    }

    const config: EmailConfig = {
      host: process.env.MAILGUN_SMTP_SERVER,
      port: parseInt(process.env.MAILGUN_SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.MAILGUN_SMTP_LOGIN,
        pass: process.env.MAILGUN_SMTP_PASSWORD,
      },
    };

    this.transporter = nodemailer.createTransport(config);

    // Verify the connection
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('Mailgun SMTP verification failed:', error);
        this.transporter = null;
      } else {
        console.log('Mailgun email service is ready to send emails');
      }
    });
  }

  async sendContactEmail(contactData: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<boolean> {
    if (!this.transporter) {
      console.log('Email service not available. Contact form submission logged to console instead.');
      console.log('Contact Form Submission:', contactData);
      return false;
    }

    const emailOptions: EmailOptions = {
      to: this.businessEmail, // Send to your business email
      subject: `Contact Form: ${contactData.subject}`,
      html: this.generateContactEmailHTML(contactData),
      text: this.generateContactEmailText(contactData),
    };

    // Also send a confirmation email to the person who submitted the form
    const confirmationOptions: EmailOptions = {
      to: contactData.email,
      subject: 'Thank you for contacting Sheridan Jobs',
      html: this.generateContactConfirmationHTML(contactData),
      text: this.generateContactConfirmationText(contactData),
    };

    try {
      // Send notification to business
      await this.transporter.sendMail({
        from: this.fromEmail,
        replyTo: contactData.email, // Allow easy reply
        ...emailOptions,
      });

      // Send confirmation to submitter
      await this.transporter.sendMail({
        from: this.fromEmail,
        ...confirmationOptions,
      });

      console.log(`Contact form submitted by ${contactData.name} (${contactData.email})`);
      return true;
    } catch (error) {
      console.error('Failed to send contact form email:', error);
      console.log('Fallback - Contact form submission:', contactData);
      return false;
    }
  }

  async sendApplicationSubmittedEmail(applicantData: {
    name: string;
    email: string;
    jobTitle: string;
    company: string;
  }): Promise<boolean> {
    if (!this.transporter) {
      console.log('Email service not available. Application confirmation logged to console instead.');
      console.log('Application submitted:', applicantData);
      return false;
    }

    const emailOptions: EmailOptions = {
      to: applicantData.email,
      subject: `Application Submitted: ${applicantData.jobTitle} at ${applicantData.company}`,
      html: this.generateApplicationSubmittedHTML(applicantData),
      text: this.generateApplicationSubmittedText(applicantData),
    };

    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        ...emailOptions,
      });
      console.log(`Application confirmation sent to ${applicantData.email}`);
      return true;
    } catch (error) {
      console.error('Failed to send application confirmation:', error);
      return false;
    }
  }

  async sendApplicationStatusUpdateEmail(applicantData: {
    name: string;
    email: string;
    jobTitle: string;
    company: string;
    status: string;
  }): Promise<boolean> {
    if (!this.transporter) {
      console.log('Email service not available. Status update logged to console instead.');
      console.log('Application status updated:', applicantData);
      return false;
    }

    const emailOptions: EmailOptions = {
      to: applicantData.email,
      subject: `Application Update: ${applicantData.jobTitle} at ${applicantData.company}`,
      html: this.generateApplicationStatusHTML(applicantData),
      text: this.generateApplicationStatusText(applicantData),
    };

    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        ...emailOptions,
      });
      console.log(`Status update email sent to ${applicantData.email} - Status: ${applicantData.status}`);
      return true;
    } catch (error) {
      console.error('Failed to send status update email:', error);
      return false;
    }
  }

  async sendNewApplicationNotificationEmail(businessData: {
    businessEmail: string;
    applicantName: string;
    jobTitle: string;
    company: string;
    applicationId: number;
  }): Promise<boolean> {
    if (!this.transporter) {
      console.log('Email service not available. New application notification logged to console instead.');
      console.log('New application received:', businessData);
      return false;
    }

    const emailOptions: EmailOptions = {
      to: businessData.businessEmail,
      subject: `New Application: ${businessData.applicantName} for ${businessData.jobTitle}`,
      html: this.generateNewApplicationHTML(businessData),
      text: this.generateNewApplicationText(businessData),
    };

    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        ...emailOptions,
      });
      console.log(`New application notification sent to ${businessData.businessEmail}`);
      return true;
    } catch (error) {
      console.error('Failed to send new application notification:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    if (!this.transporter) {
      console.log('Email service not available. Reset link logged to console instead.');
      console.log(`Password reset link: ${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`);
      return false;
    }

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
    
    const emailOptions: EmailOptions = {
      to: email,
      subject: 'Reset Your Sheridan Jobs Password',
      html: this.generatePasswordResetHTML(resetUrl),
      text: this.generatePasswordResetText(resetUrl),
    };

    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        ...emailOptions,
      });
      console.log(`Password reset email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      console.log(`Fallback - Password reset link: ${resetUrl}`);
      return false;
    }
  }

  private generatePasswordResetHTML(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password - Sheridan Jobs</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2d5a27 0%, #8b4513 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🏔️ Sheridan Jobs</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0;">Wyoming's Premier Job Board</p>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #ddd; border-top: none;">
            <h2 style="color: #2d5a27; margin-top: 0;">Reset Your Password</h2>
            
            <p>Hello!</p>
            
            <p>We received a request to reset the password for your Sheridan Jobs account. If you made this request, click the button below to set a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #2d5a27; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            
            <p>This link will expire in 1 hour for security reasons.</p>
            
            <p>If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #666;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #2d5a27; word-break: break-all;">${resetUrl}</a>
            </p>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Best regards,<br>
              The Sheridan Jobs Team
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px;">
            <p>© 2024 Sheridan Jobs. Connecting Wyoming's workforce.</p>
          </div>
        </body>
      </html>
    `;
  }

  private generateContactEmailHTML(contactData: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contact Form Submission - Sheridan Jobs</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2d5a27 0%, #8b4513 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🏔️ Sheridan Jobs</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0;">Contact Form Submission</p>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #ddd; border-top: none;">
            <h2 style="color: #2d5a27; margin-top: 0;">New Contact Form Submission</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Name:</strong> ${contactData.name}</p>
              <p><strong>Email:</strong> ${contactData.email}</p>
              <p><strong>Subject:</strong> ${contactData.subject}</p>
            </div>
            
            <h3 style="color: #2d5a27;">Message:</h3>
            <div style="background: #ffffff; border: 1px solid #ddd; padding: 20px; border-radius: 5px;">
              <p style="white-space: pre-wrap;">${contactData.message}</p>
            </div>
            
            <p style="margin-top: 30px; color: #666;">
              You can reply directly to this email to respond to ${contactData.name}.
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px;">
            <p>© 2024 Sheridan Jobs. Connecting Wyoming's workforce.</p>
          </div>
        </body>
      </html>
    `;
  }

  private generateContactConfirmationHTML(contactData: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Thank You - Sheridan Jobs</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2d5a27 0%, #8b4513 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🏔️ Sheridan Jobs</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0;">Wyoming's Premier Job Board</p>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #ddd; border-top: none;">
            <h2 style="color: #2d5a27; margin-top: 0;">Thank You, ${contactData.name}!</h2>
            
            <p>We've received your message and will get back to you soon. Here's a copy of what you sent:</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Subject:</strong> ${contactData.subject}</p>
              <p><strong>Message:</strong></p>
              <p style="white-space: pre-wrap; margin-top: 10px;">${contactData.message}</p>
            </div>
            
            <p>Our team typically responds within 24 hours during business days. If you have urgent questions, feel free to give us a call.</p>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              The Sheridan Jobs Team
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px;">
            <p>© 2024 Sheridan Jobs. Connecting Wyoming's workforce.</p>
          </div>
        </body>
      </html>
    `;
  }

  private generateContactEmailText(contactData: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): string {
    return `
New Contact Form Submission - Sheridan Jobs

Name: ${contactData.name}
Email: ${contactData.email}
Subject: ${contactData.subject}

Message:
${contactData.message}

You can reply directly to this email to respond to ${contactData.name}.

© 2024 Sheridan Jobs. Connecting Wyoming's workforce.
    `.trim();
  }

  private generateContactConfirmationText(contactData: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): string {
    return `
Thank You for Contacting Sheridan Jobs

Hello ${contactData.name},

We've received your message and will get back to you soon. Here's a copy of what you sent:

Subject: ${contactData.subject}

Message:
${contactData.message}

Our team typically responds within 24 hours during business days. If you have urgent questions, feel free to give us a call.

Best regards,
The Sheridan Jobs Team

© 2024 Sheridan Jobs. Connecting Wyoming's workforce.
    `.trim();
  }

  private generateApplicationSubmittedHTML(applicantData: {
    name: string;
    email: string;
    jobTitle: string;
    company: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Application Submitted - Sheridan Jobs</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2d5a27 0%, #8b4513 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🏔️ Sheridan Jobs</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0;">Application Submitted Successfully</p>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #ddd; border-top: none;">
            <h2 style="color: #2d5a27; margin-top: 0;">Thank You, ${applicantData.name}!</h2>
            
            <p>Your application has been successfully submitted and is now being reviewed by the hiring team.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #2d5a27; margin-top: 0;">Application Details:</h3>
              <p><strong>Position:</strong> ${applicantData.jobTitle}</p>
              <p><strong>Company:</strong> ${applicantData.company}</p>
              <p><strong>Applied On:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <p>You'll receive email updates as your application progresses through the review process. The hiring team typically responds within 3-5 business days.</p>
            
            <p style="margin-top: 30px;">
              Best of luck!<br>
              The Sheridan Jobs Team
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px;">
            <p>© 2024 Sheridan Jobs. Connecting Wyoming's workforce.</p>
          </div>
        </body>
      </html>
    `;
  }

  private generateApplicationStatusHTML(applicantData: {
    name: string;
    email: string;
    jobTitle: string;
    company: string;
    status: string;
  }): string {
    const statusMessages = {
      reviewed: 'Your application has been reviewed and is moving forward in the process.',
      contacted: 'Great news! The employer would like to contact you directly.',
      rejected: 'Thank you for your interest. While this position wasn\'t a match, we encourage you to apply for future openings.'
    };

    const statusColor = applicantData.status === 'contacted' ? '#2d5a27' : 
                       applicantData.status === 'reviewed' ? '#8b4513' : '#666';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Application Update - Sheridan Jobs</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2d5a27 0%, #8b4513 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🏔️ Sheridan Jobs</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0;">Application Status Update</p>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #ddd; border-top: none;">
            <h2 style="color: #2d5a27; margin-top: 0;">Hello ${applicantData.name},</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Position:</strong> ${applicantData.jobTitle}</p>
              <p><strong>Company:</strong> ${applicantData.company}</p>
              <p style="margin: 15px 0;"><strong>Status:</strong> 
                <span style="color: ${statusColor}; font-weight: bold; text-transform: capitalize;">${applicantData.status}</span>
              </p>
            </div>
            
            <p>${statusMessages[applicantData.status as keyof typeof statusMessages] || 'Your application status has been updated.'}</p>
            
            ${applicantData.status === 'contacted' ? 
              '<p style="background: #e8f5e8; padding: 15px; border-radius: 5px; border-left: 4px solid #2d5a27;">Please keep an eye on your email and phone for communication from the employer.</p>' : ''}
            
            <p style="margin-top: 30px;">
              Thank you for using Sheridan Jobs!<br>
              The Sheridan Jobs Team
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px;">
            <p>© 2024 Sheridan Jobs. Connecting Wyoming's workforce.</p>
          </div>
        </body>
      </html>
    `;
  }

  private generateNewApplicationHTML(businessData: {
    businessEmail: string;
    applicantName: string;
    jobTitle: string;
    company: string;
    applicationId: number;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Job Application - Sheridan Jobs</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2d5a27 0%, #8b4513 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🏔️ Sheridan Jobs</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0;">New Job Application Received</p>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #ddd; border-top: none;">
            <h2 style="color: #2d5a27; margin-top: 0;">New Application Alert</h2>
            
            <p>You've received a new job application for your posting!</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #2d5a27; margin-top: 0;">Application Details:</h3>
              <p><strong>Applicant:</strong> ${businessData.applicantName}</p>
              <p><strong>Position:</strong> ${businessData.jobTitle}</p>
              <p><strong>Company:</strong> ${businessData.company}</p>
              <p><strong>Application ID:</strong> #${businessData.applicationId}</p>
              <p><strong>Received:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/business/dashboard" 
                 style="background: #2d5a27; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Review Application
              </a>
            </div>
            
            <p>Log in to your business dashboard to review the application, view the candidate's resume, and manage your hiring process.</p>
            
            <p style="margin-top: 30px;">
              Happy hiring!<br>
              The Sheridan Jobs Team
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px;">
            <p>© 2024 Sheridan Jobs. Connecting Wyoming's workforce.</p>
          </div>
        </body>
      </html>
    `;
  }

  private generateApplicationSubmittedText(applicantData: {
    name: string;
    email: string;
    jobTitle: string;
    company: string;
  }): string {
    return `
Application Submitted Successfully - Sheridan Jobs

Thank You, ${applicantData.name}!

Your application has been successfully submitted and is now being reviewed by the hiring team.

Application Details:
Position: ${applicantData.jobTitle}
Company: ${applicantData.company}
Applied On: ${new Date().toLocaleDateString()}

You'll receive email updates as your application progresses through the review process. The hiring team typically responds within 3-5 business days.

Best of luck!
The Sheridan Jobs Team

© 2024 Sheridan Jobs. Connecting Wyoming's workforce.
    `.trim();
  }

  private generateApplicationStatusText(applicantData: {
    name: string;
    email: string;
    jobTitle: string;
    company: string;
    status: string;
  }): string {
    const statusMessages = {
      reviewed: 'Your application has been reviewed and is moving forward in the process.',
      contacted: 'Great news! The employer would like to contact you directly.',
      rejected: 'Thank you for your interest. While this position wasn\'t a match, we encourage you to apply for future openings.'
    };

    return `
Application Status Update - Sheridan Jobs

Hello ${applicantData.name},

Position: ${applicantData.jobTitle}
Company: ${applicantData.company}
Status: ${applicantData.status.toUpperCase()}

${statusMessages[applicantData.status as keyof typeof statusMessages] || 'Your application status has been updated.'}

${applicantData.status === 'contacted' ? 'Please keep an eye on your email and phone for communication from the employer.' : ''}

Thank you for using Sheridan Jobs!
The Sheridan Jobs Team

© 2024 Sheridan Jobs. Connecting Wyoming's workforce.
    `.trim();
  }

  private generateNewApplicationText(businessData: {
    businessEmail: string;
    applicantName: string;
    jobTitle: string;
    company: string;
    applicationId: number;
  }): string {
    return `
New Job Application Received - Sheridan Jobs

You've received a new job application for your posting!

Application Details:
Applicant: ${businessData.applicantName}
Position: ${businessData.jobTitle}
Company: ${businessData.company}
Application ID: #${businessData.applicationId}
Received: ${new Date().toLocaleDateString()}

Log in to your business dashboard to review the application, view the candidate's resume, and manage your hiring process.

Dashboard: ${process.env.FRONTEND_URL || 'http://localhost:5000'}/business/dashboard

Happy hiring!
The Sheridan Jobs Team

© 2024 Sheridan Jobs. Connecting Wyoming's workforce.
    `.trim();
  }

  private generatePasswordResetText(resetUrl: string): string {
    return `
Reset Your Sheridan Jobs Password

Hello!

We received a request to reset the password for your Sheridan Jobs account. If you made this request, visit the following link to set a new password:

${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.

Best regards,
The Sheridan Jobs Team

© 2024 Sheridan Jobs. Connecting Wyoming's workforce.
    `.trim();
  }
}

export const emailService = new EmailService();