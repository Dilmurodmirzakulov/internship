const Footer = () => {
  return (
    <footer className="content-footer footer bg-footer-theme">
      <div className="container-xxl d-flex flex-wrap justify-content-between py-2 flex-md-row flex-column">
        <div className="mb-2 mb-md-0">
          © {new Date().getFullYear()} <strong>Techamal</strong> - Internship
          Management System. Made with ❤️ for educational excellence.
        </div>
        <div className="d-none d-lg-inline-block">
          <a aria-label="About Techamal" href="#" className="footer-link me-4">
            About
          </a>
          <a aria-label="Techamal Help" href="#" className="footer-link me-4">
            Help
          </a>
          <a aria-label="Contact Techamal" href="#" className="footer-link">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
