import React from "react";

function ContactPage() {
  return (
    <div className="content">
      <h2 className="page-title">Get In Touch</h2>

      <section className="contact-info">
        <p>
          Feel free to reach out for collaboration, questions about this
          project, or opportunities.
        </p>

        <div className="contact-item">
          <span role="img" aria-label="email">
            📧
          </span>
          <strong>Email:</strong>
          <a href="mailto:humaira.yosufi@gmail.com">
            humaira.yosufi@gmail.com
          </a>
        </div>

        <div className="contact-item">
          <span role="img" aria-label="briefcase">
            💼
          </span>
          <strong>LinkedIn:</strong>
          <a
            href="https://linkedin.com/in/homaira-yousufi"
            target="_blank"
            rel="noreferrer"
          >
            linkedin.com/in/homaira-yousufi
          </a>
        </div>

        <div className="contact-item">
          <span role="img" aria-label="laptop">
            💻
          </span>
          <strong>GitHub:</strong>
          <a
            href="https://github.com/homaira1379"
            target="_blank"
            rel="noreferrer"
          >
            github.com/homaira1379
          </a>
        </div>
      </section>
    </div>
  );
}

export default ContactPage;
