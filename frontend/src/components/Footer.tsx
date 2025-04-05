import { FaLinkedin, FaTwitter, FaFacebook, FaGithub } from 'react-icons/fa';
import '@/styles/components/Footer.css';

export default function Footer() {
  return (
    <footer className="py-4 footer-container">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-md-6 text-center text-md-start">
            <span className="footer-text">
              © {new Date().getFullYear()} Bazaar Technologies. All rights reserved.
            </span>
          </div>
          <div className="col-md-6">
            <div className="d-flex gap-3 justify-content-center justify-content-md-end mt-3 mt-md-0">
              <a href="#" className="social-icon social-icon-link">
                <FaLinkedin />
              </a>
              <a href="#" className="social-icon social-icon-link">
                <FaTwitter />
              </a>
              <a href="#" className="social-icon social-icon-link">
                <FaFacebook />
              </a>
              <a href="#" className="social-icon social-icon-link">
                <FaGithub />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 