import React from "react"

const Footer = _ => {
  return (
    <footer className="relative w-full h-56 text-secondary overflow-hidden bg-secondary">
      <div className="container h-full md:max-w-screen-md lg:max-w-screen-xl m-auto px-5 md:px-20 pb-12 pt-24">
        <div className="container flex-col justify-between md:space-y-8">
          <div className="flex flex-col-reverse md:flex-row md:justify-between space-y-reverse space-y-8 md:space-y-0">
            <span
              className="text-xs tracking-wider self-center md:self-end"
              aria-label="Copyright"
            >
              © {`${new Date().getFullYear()} `} Raki Rahman.
            </span>
            <div className="flex flex-row items-center space-x-4 justify-center md:justify-end">
              <span>
                <a
                  href="https://github.com/mdrakiburrahman"
                  aria-label="Visit GitHub profile"
                  title="Visit GitHub profile"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg
                    aria-hidden="true"
                    className="h-8 w-8 text-secondary hover:text-accent transition duration-100"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 30 30"
                  >
                    <path d="M14.988 2.235C7.743 2.232 1.875 8.098 1.875 15.337c0 5.724 3.67 10.59 8.783 12.378.689.173.583-.317.583-.65v-2.271c-3.975.466-4.137-2.165-4.403-2.605-.54-.92-1.814-1.154-1.433-1.593.906-.466 1.828.117 2.898 1.696.773 1.145 2.282.952 3.047.762a3.695 3.695 0 011.016-1.781c-4.119-.739-5.836-3.253-5.836-6.24 0-1.451.478-2.784 1.415-3.86-.597-1.772.056-3.29.144-3.515 1.702-.152 3.471 1.219 3.61 1.327.966-.26 2.07-.398 3.307-.398 1.242 0 2.35.143 3.325.407.331-.252 1.972-1.43 3.554-1.286.085.226.723 1.708.16 3.457.95 1.078 1.433 2.423 1.433 3.876 0 2.994-1.728 5.51-5.859 6.237a3.733 3.733 0 011.116 2.666v3.296c.024.264 0 .525.44.525 5.188-1.75 8.924-6.65 8.924-12.425 0-7.242-5.872-13.105-13.11-13.105z" />
                  </svg>
                </a>
              </span>
              <span>
                <a
                  href="https://www.linkedin.com/in/mdrakiburrahman/"
                  aria-label="Visit LinkedIn profile"
                  title="Visit LinkedIn profile"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg
                    aria-hidden="true"
                    className="h-8 w-8 text-secondary hover:text-accent transition duration-100"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 32 32"
                  >
                    <path d="M27.5 3.5h-23c-.553 0-1 .447-1 1v23c0 .553.447 1 1 1h23c.553 0 1-.447 1-1v-23c0-.553-.447-1-1-1zM10.916 24.803h-3.71V12.872h3.71v11.931zM9.062 11.241a2.15 2.15 0 110-4.301 2.15 2.15 0 010 4.3zm15.741 13.562h-3.706V19c0-1.384-.025-3.162-1.928-3.162-1.928 0-2.225 1.506-2.225 3.062v5.903H13.24V12.872h3.556v1.631h.05c.494-.937 1.703-1.928 3.51-1.928 3.756 0 4.446 2.472 4.446 5.684v6.544z" />
                  </svg>
                </a>
              </span>
              <span>
                <a
                  href="https://www.youtube.com/channel/UCL2MnlXaD94Ey1RYwlZuTag/featured"
                  aria-label="Visit YouTube channel"
                  title="Visit YouTube channel"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg
                    aria-hidden="true"
                    className="h-8 w-8 text-secondary hover:text-accent transition duration-100"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                  >
                    <path d="M492.044,106.769c-18.482-21.97-52.604-30.931-117.77-30.931H137.721
                            c-66.657,0-101.358,9.54-119.77,32.93C0,131.572,0,165.174,0,211.681v88.64c0,90.097,21.299,135.842,137.721,135.842h236.554
                            c56.512,0,87.826-7.908,108.085-27.296C503.136,388.985,512,356.522,512,300.321v-88.64
                            C512,162.636,510.611,128.836,492.044,106.769z M328.706,268.238l-107.418,56.14c-2.401,1.255-5.028,1.878-7.65,1.878
                            c-2.97,0-5.933-0.799-8.557-2.388c-4.942-2.994-7.959-8.351-7.959-14.128V197.82c0-5.767,3.009-11.119,7.941-14.115
                            c4.933-2.996,11.069-3.201,16.187-0.542l107.418,55.778c5.465,2.837,8.897,8.479,8.905,14.635
                            C337.58,259.738,334.163,265.388,328.706,268.238z"/>
                  </svg>
                </a>
              </span>
              <span>
                <a
                  href="https://www.rakirahman.me/rss.xml"
                  aria-label="View RSS Feed"
                  title="View RSS Feed"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg
                    aria-hidden="true"
                    className="h-8 w-8 text-secondary hover:text-accent transition duration-100"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 31 31"
                  >
                    <path
                      transform="translate(0,3)"
                      d="M6.503 20.752c0 1.794-1.456 3.248-3.251 3.248-1.796 0-3.252-1.454-3.252-3.248 0-1.794 1.456-3.248 3.252-3.248 1.795.001 3.251 1.454 3.251 3.248zm-6.503-12.572v4.811c6.05.062 10.96 4.966 11.022 11.009h4.817c-.062-8.71-7.118-15.758-15.839-15.82zm0-3.368c10.58.046 19.152 8.594 19.183 19.188h4.817c-.03-13.231-10.755-23.954-24-24v4.812z"
                    />
                  </svg>
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
