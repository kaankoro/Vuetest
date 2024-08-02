<template>

  <div class="w-full h-full absolute top-0 left-0 overflow-hidden">
    <div class="relative flex flex-col items-center justify-between w-full h-full">
      <router-link to="/">
        <span
          class="z-50 absolute left-2 top-2 w-[34px] h-[32px] flex justify-center items-center rounded-full bg-[#F2F6FB] opacity-70 cursor-pointer hover:bg-dark group"><svg
            width="8" height="12" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path class="group-hover:fill-white"
              d="M6.99953 0.705083C6.8127 0.517831 6.55905 0.412598 6.29453 0.412598C6.03001 0.412598 5.77636 0.517831 5.58953 0.705083L0.999531 5.29508C0.609531 5.68508 0.609531 6.31508 0.999531 6.70508L5.58953 11.2951C5.97953 11.6851 6.60953 11.6851 6.99953 11.2951C7.38953 10.9051 7.38953 10.2751 6.99953 9.88508L3.11953 5.99508L6.99953 2.11508C7.38953 1.72508 7.37953 1.08508 6.99953 0.705083Z"
              fill="black"></path>
          </svg></span>
      </router-link>

      <video v-if="!doneCounting || isRecording" ref="video" autoplay muted class="aspect-video h-full w-full"></video>
      <video v-else ref="recordedvideo" :src="`https://kaan.recram.com/${displayVideo}`" autoplay playsinline
        class="cursor-pointer aspect-video h-full w-full" @click="togglePlayPause"
        @playing="recordedVideoPaused = false" @pause="recordedVideoPaused = true"></video>

      <span v-if="recordedVideoPaused" @click="startRecordedVideo"
        class="absolute left-[calc(50%-40px)] top-[calc(50%-120px)] flex w-[80px] h-[80px] cursor-pointer items-center justify-center rounded-full bg-[#FFFFFF] opacity-60 outline-none ring-inset ring-media-focus hover:bg-[#ffffff] data-[focus]:ring-4 z-40"><svg
          fill="#111827" height="60" viewBox="0 0 16 16" width="60" xmlns="http://www.w3.org/2000/svg"
          class="fill-[#111827] text-white">
          <path
            d="M4.61847 4.54669V11.4534C4.61847 11.98 5.19847 12.3 5.64514 12.0134L11.0718 8.56003C11.4851 8.30003 11.4851 7.70003 11.0718 7.43336L5.64514 3.98669C5.19847 3.70003 4.61847 4.02003 4.61847 4.54669Z">
          </path>
        </svg></span>

      <span v-if="!isCounting"
        class="clickHereText text-md lg:text-xl text-white mb-6 bottom-[160px] lg:bottom-[200px]">
        <p class="text-[#F8000F]">Click</p>
        here if you are ready to record.
      </span>
      <div v-if="!isRecording && !doneRecording" class="record-footer-container bottom-[80px] lg:bottom-[120px]">
        <div class="record-footer z-40">
          <button class="transition-colors duration-500 ease-in-out hover:bg-darkred record-circle play-record-icon"
            @click="countDown">
          </button>

          <svg class="cursor-pointer ml-6 block lg:hidden" width="33" height="32" viewBox="0 0 33 32" fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <mask id="mask0_5794_52610" maskUnits="userSpaceOnUse" x="5" y="2" width="22" height="28"
              style="mask-type: alpha;">
              <path fill-rule="evenodd" clip-rule="evenodd"
                d="M16.1853 2.94654V5.33321C22.0786 5.33321 26.8519 10.1065 26.8519 15.9999C26.8519 17.3865 26.5853 18.7199 26.0919 19.9332C25.7319 20.8265 24.5853 21.0665 23.9053 20.3865C23.5453 20.0265 23.3986 19.4799 23.5986 18.9999C23.9853 18.0799 24.1853 17.0532 24.1853 15.9999C24.1853 11.5865 20.5986 7.99988 16.1853 7.99988V10.3865C16.1853 10.9865 15.4653 11.2799 15.0386 10.8665L11.3186 7.14654C11.0519 6.87988 11.0519 6.46654 11.3186 6.19988L15.0519 2.47988C15.4653 2.05321 16.1853 2.34654 16.1853 2.94654ZM8.18522 16C8.18522 20.4133 11.7719 24 16.1852 24V21.6133C16.1852 21.0133 16.9052 20.72 17.3186 21.1333L21.0386 24.8533C21.3052 25.12 21.3052 25.5333 21.0386 25.8L17.3186 29.52C16.9052 29.9466 16.1852 29.6533 16.1852 29.0533V26.6666C10.2919 26.6666 5.51855 21.8933 5.51855 16C5.51855 14.6133 5.78522 13.28 6.27855 12.0666C6.63855 11.1733 7.78522 10.9333 8.46522 11.6133C8.82522 11.9733 8.97189 12.52 8.77189 13C8.38522 13.92 8.18522 14.9466 8.18522 16Z"
                fill="black"></path>
            </mask>
            <g mask="url(#mask0_5794_52610)">
              <rect x="0.185547" width="32" height="32" fill="#F2F6FB"></rect>
            </g>
          </svg>
        </div>
      </div>
      <div v-else-if="!doneRecording" class="record-footer-container bottom-[80px] lg:bottom-[120px]">
        <div class="record-footer z-40">
          <button class="record-circle pause-record-icon" @click="pauseRecordingHandler">

            <svg v-if="!allowedToPause" width="200px" height="200px" xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid"
              class="selectButtonIcon w-[40px]" style="background: none;">
              <circle cx="75" cy="50" fill="#fff" r="6.39718">
                <animate attributeName="r" values="4.8;4.8;8;4.8;4.8" times="0;0.1;0.2;0.3;1" dur="1s"
                  repeatCount="indefinite" begin="-0.875s">
                </animate>
              </circle>
              <circle cx="67.678" cy="67.678" fill="#fff" r="4.8">
                <animate attributeName="r" values="4.8;4.8;8;4.8;4.8" times="0;0.1;0.2;0.3;1" dur="1s"
                  repeatCount="indefinite" begin="-0.75s">
                </animate>
              </circle>
              <circle cx="50" cy="75" fill="#fff" r="4.8">
                <animate attributeName="r" values="4.8;4.8;8;4.8;4.8" times="0;0.1;0.2;0.3;1" dur="1s"
                  repeatCount="indefinite" begin="-0.625s">
                </animate>
              </circle>
              <circle cx="32.322" cy="67.678" fill="#fff" r="4.8">
                <animate attributeName="r" values="4.8;4.8;8;4.8;4.8" times="0;0.1;0.2;0.3;1" dur="1s"
                  repeatCount="indefinite" begin="-0.5s">
                </animate>
              </circle>
              <circle cx="25" cy="50" fill="#fff" r="4.8">
                <animate attributeName="r" values="4.8;4.8;8;4.8;4.8" times="0;0.1;0.2;0.3;1" dur="1s"
                  repeatCount="indefinite" begin="-0.375s">
                </animate>
              </circle>
              <circle cx="32.322" cy="32.322" fill="#fff" r="4.80282">
                <animate attributeName="r" values="4.8;4.8;8;4.8;4.8" times="0;0.1;0.2;0.3;1" dur="1s"
                  repeatCount="indefinite" begin="-0.25s">
                </animate>
              </circle>
              <circle cx="50" cy="25" fill="#fff" r="6.40282">
                <animate attributeName="r" values="4.8;4.8;8;4.8;4.8" times="0;0.1;0.2;0.3;1" dur="1s"
                  repeatCount="indefinite" begin="-0.125s">
                </animate>
              </circle>
              <circle cx="67.678" cy="32.322" fill="#fff" r="7.99718">
                <animate attributeName="r" values="4.8;4.8;8;4.8;4.8" times="0;0.1;0.2;0.3;1" dur="1s"
                  repeatCount="indefinite" begin="0s">
                </animate>
              </circle>
            </svg>

            <span v-else></span>

          </button>
          <div class="duration-timer-container">
            <span class="duration-timer-circle"></span>
            <span class="duration-timer-video">00:{{ displayRecordingTime }}</span>
            <span class="duration-timer-limit ml-1"> / 00:30</span>
          </div>
        </div>
      </div>
      <a href="https://recram.com?utm_source=RForms&amp;utm_medium=Forms&amp;utm_campaign=RecRam-widget&amp;utm_term=66aa25706e2d87a8e87a0913"
        target="_blank"><svg width="78" height="24" viewBox="0 0 78 24" fill="none" xmlns="http://www.w3.org/2000/svg"
          class="absolute left-[calc(50%-34px)] bottom-[20px]">
          <g filter="url(#filter0_b_5703_93252)">
            <rect width="77.7298" height="24" rx="6" fill="white" fill-opacity="0.8"></rect>
            <path
              d="M14.265 16.5253C13.0263 16.5257 11.8152 16.1588 10.785 15.471C9.75484 14.7831 8.95178 13.8052 8.47741 12.6609C8.00303 11.5166 7.87867 10.2573 8.12005 9.04233C8.36142 7.82734 8.95768 6.71122 9.83343 5.83513C10.7092 4.95905 11.8251 4.36235 13.04 4.12051C14.2549 3.87867 15.5142 4.00255 16.6587 4.47648C17.8032 4.95042 18.7814 5.75311 19.4697 6.78305C20.1579 7.81298 20.5253 9.0239 20.5253 10.2626C20.5234 11.9226 19.8633 13.514 18.6897 14.688C17.5162 15.862 15.925 16.5227 14.265 16.5253ZM14.265 4.7204C13.1687 4.71992 12.0968 5.04463 11.185 5.65343C10.2732 6.26224 9.56251 7.12779 9.14273 8.1406C8.72295 9.15341 8.613 10.268 8.82677 11.3433C9.04054 12.4186 9.56844 13.4063 10.3437 14.1816C11.1189 14.9568 12.1067 15.4847 13.182 15.6985C14.2573 15.9123 15.3719 15.8023 16.3847 15.3825C17.3975 14.9628 18.263 14.252 18.8718 13.3402C19.4806 12.4284 19.8053 11.3566 19.8049 10.2602C19.803 8.79156 19.2187 7.38359 18.1802 6.34508C17.1417 5.30657 15.7337 4.7223 14.265 4.7204Z"
              fill="#111827"></path>
            <path
              d="M20.118 17.5986L15.2625 12.7431C14.9991 12.4799 14.6419 12.332 14.2696 12.332C13.8972 12.332 13.54 12.4799 13.2766 12.7431L11.1707 14.8491C11.3759 14.9894 11.59 15.1161 11.8118 15.2285L13.7857 13.2522C13.914 13.1266 14.0864 13.0563 14.266 13.0563C14.4455 13.0563 14.6179 13.1266 14.7462 13.2522L19.6017 18.1076C19.6967 18.2032 19.7615 18.3247 19.7877 18.4569C19.814 18.5891 19.8007 18.7261 19.7494 18.8508C19.6981 18.9754 19.6111 19.0821 19.4994 19.1576C19.3877 19.233 19.2562 19.2737 19.1214 19.2747H9.41529C9.28051 19.2737 9.14901 19.233 9.03729 19.1576C8.92557 19.0821 8.83861 18.9754 8.78732 18.8508C8.73602 18.7261 8.72267 18.5891 8.74895 18.4569C8.77523 18.3247 8.83997 18.2032 8.93503 18.1076L11.2835 15.7592C11.0668 15.6403 10.8567 15.5097 10.6544 15.3678L8.42595 17.5986C8.22729 17.7943 8.0915 18.0448 8.03593 18.3181C7.98036 18.5914 8.00755 18.8751 8.11401 19.1329C8.22047 19.3906 8.40136 19.6108 8.63358 19.7652C8.86581 19.9197 9.13881 20.0014 9.4177 19.9999H19.1262C19.4048 20.0007 19.6773 19.9186 19.9091 19.7642C20.141 19.6097 20.3217 19.3899 20.4282 19.1325C20.5348 18.8751 20.5624 18.5918 20.5076 18.3187C20.4528 18.0456 20.318 17.7949 20.1204 17.5986H20.118Z"
              fill="#111827"></path>
            <path
              d="M69.7334 16.0628H69.158V12.587C69.158 11.4714 68.4065 10.6847 67.3027 10.6847C66.1989 10.6847 65.4356 11.5067 65.4356 12.6222V16.0628H64.8603V12.6222C64.8603 11.5067 64.097 10.6964 62.9932 10.6964C61.8894 10.6964 61.1379 11.5067 61.1379 12.6222V16.0628H60.5625V10.262H61.1027L61.1144 11.2248C61.5136 10.4616 62.2534 10.1445 63.0049 10.1445C63.8856 10.1445 64.8133 10.5438 65.1538 11.5771C65.5061 10.626 66.4103 10.1445 67.3027 10.1445C68.7235 10.1445 69.7334 11.1426 69.7334 12.587V16.0628Z"
              fill="#111827"></path>
            <path
              d="M58.085 10.2619H58.6604C58.6604 12.1994 58.6604 14.1251 58.6604 16.0627H58.085V14.8297C57.5213 15.7339 56.6524 16.1566 55.713 16.1566C54.0925 16.1566 52.7656 14.9354 52.7656 13.1623C52.7656 11.3891 54.0925 10.1914 55.713 10.1914C56.6524 10.1914 57.6035 10.6259 58.085 11.5301V10.2619ZM55.713 10.7433C54.3978 10.7433 53.341 11.7062 53.341 13.1623C53.341 14.6183 54.3978 15.593 55.713 15.593C58.9422 15.593 58.9422 10.7433 55.713 10.7433Z"
              fill="#111827"></path>
            <path
              d="M49.0894 12.916L51.9898 16.063H51.1561L48.3144 12.9513H46.0716V16.063H45.4375V7.84326C46.647 7.84326 47.8447 7.84326 49.0542 7.84326C50.8391 7.84326 51.7432 9.1232 51.755 10.4031C51.7667 11.7418 50.886 12.916 49.0894 12.916ZM46.0716 8.43039V12.3524H48.9837C50.4163 12.3524 51.0504 11.5422 51.0622 10.3914C51.0739 9.4285 50.4163 8.43039 49.0542 8.43039H46.0716Z"
              fill="#111827"></path>
            <path
              d="M43.4744 14.9002L43.8619 15.2877C43.2747 15.8748 42.5115 16.1566 41.7482 16.1566C40.116 16.1566 38.7656 14.9941 38.7656 13.1623C38.7656 11.3305 40.069 10.168 41.7482 10.168C42.5115 10.168 43.2747 10.4615 43.8619 11.0369L43.4979 11.4009C43.0282 10.9312 42.3706 10.7081 41.7482 10.7081C40.4331 10.7081 39.3293 11.6006 39.3293 13.1623C39.3293 14.7241 40.4331 15.6165 41.7482 15.6165C42.3706 15.6165 43.0047 15.3699 43.4744 14.9002Z"
              fill="#111827"></path>
            <path
              d="M34.8224 16.1566C33.1902 16.1566 31.875 15.0059 31.875 13.1623C31.875 11.4244 33.1902 10.168 34.8224 10.168C36.4546 10.168 37.9107 11.1661 37.6875 13.4324H32.4621C32.5796 14.7945 33.6246 15.593 34.8224 15.593C35.5856 15.593 36.4781 15.2877 36.9125 14.7123L37.3235 15.0411C36.7599 15.7809 35.75 16.1566 34.8224 16.1566ZM32.4621 12.9275H37.1709C37.1591 11.4949 36.2197 10.6964 34.8224 10.6964C33.6246 10.6964 32.5913 11.5066 32.4621 12.9275Z"
              fill="#111827"></path>
            <path
              d="M28.191 12.916L31.0914 16.063H30.2577L27.416 12.9513H25.1732V16.063H24.5391V7.84326C25.7485 7.84326 26.9463 7.84326 28.1558 7.84326C29.9406 7.84326 30.8448 9.1232 30.8565 10.4031C30.8683 11.7418 29.9876 12.916 28.191 12.916ZM25.1732 8.43039V12.3524H28.0853C29.5179 12.3524 30.152 11.5422 30.1637 10.3914C30.1755 9.4285 29.5179 8.43039 28.1558 8.43039H25.1732Z"
              fill="#111827"></path>
          </g>
          <defs>
            <filter id="filter0_b_5703_93252" x="-8" y="-8" width="93.7266" height="40" filterUnits="userSpaceOnUse"
              color-interpolation-filters="sRGB">
              <feFlood flood-opacity="0" result="BackgroundImageFix"></feFlood>
              <feGaussianBlur in="BackgroundImageFix" stdDeviation="4"></feGaussianBlur>
              <feComposite in2="SourceAlpha" operator="in" result="effect1_backgroundBlur_5703_93252"></feComposite>
              <feBlend mode="normal" in="SourceGraphic" in2="effect1_backgroundBlur_5703_93252" result="shape">
              </feBlend>
            </filter>
          </defs>
        </svg>
      </a>
      <span v-if="!isCounting" @click="openedSettings = !openedSettings"
        class="w-[48px] h-[48px] bg-[#00000066] hover:bg-dark cursor-pointer right-5 bottom-5 absolute flex justify-center items-center rounded-lg"><svg
          width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          <mask id="mask0_7118_39672" style="mask-type:alpha;" maskUnits="userSpaceOnUse" x="3" y="3" width="24"
            height="24">
            <path fill-rule="evenodd" clip-rule="evenodd"
              d="M19.424 19.4205C19.2236 19.6209 19.0174 19.7918 18.8053 19.9567L19.0763 22.1723C19.0999 22.3727 18.9703 22.5613 18.7699 22.6202L15.5526 23.4805C15.3522 23.5394 15.146 23.4392 15.0635 23.2507L14.1855 21.1942C13.6493 21.1176 13.119 20.9879 12.6122 20.7758L10.8267 22.1134C10.6676 22.2372 10.4378 22.2195 10.2905 22.0722L7.9335 19.7152C7.78619 19.5678 7.76851 19.338 7.89225 19.1789L9.22986 17.3935C9.01773 16.8867 8.8822 16.3623 8.81149 15.8202L6.75499 14.9422C6.57821 14.8597 6.46626 14.6534 6.52518 14.4531L7.38549 11.2358C7.44442 11.0354 7.63298 10.9058 7.83333 10.9294L10.0489 11.2004C10.2139 10.9883 10.3907 10.7761 10.5852 10.5817C10.7796 10.3872 10.9917 10.2105 11.2039 10.0455L10.9328 7.82987C10.9092 7.62952 11.033 7.43507 11.2392 7.38203L14.4566 6.52172C14.6569 6.46279 14.8631 6.56297 14.9456 6.75153L15.8236 8.80803C16.3599 8.88463 16.8902 9.01427 17.3969 9.2264L19.1824 7.88879C19.3415 7.76505 19.5713 7.78273 19.7186 7.93004L22.0756 10.2871C22.223 10.4344 22.2406 10.6642 22.1169 10.8233L20.7793 12.6087C20.9914 13.1155 21.1269 13.6399 21.1976 14.182L23.2541 15.06C23.4309 15.1425 23.5429 15.3488 23.484 15.5491L22.6236 18.7665C22.5647 18.9668 22.3762 19.0964 22.1758 19.0729L19.9602 18.8018C19.7952 19.0139 19.6243 19.2202 19.424 19.4205ZM12.9422 12.9387C11.8049 14.076 11.8049 15.9262 12.9422 17.0635C14.0794 18.2008 15.9297 18.2008 17.067 17.0635C18.2042 15.9262 18.2042 14.076 17.067 12.9387C15.9297 11.8015 14.0794 11.8015 12.9422 12.9387Z"
              fill="black"></path>
          </mask>
          <g mask="url(#mask0_7118_39672)">
            <rect x="15" y="0.85791" width="20" height="20" transform="rotate(45 15 0.85791)" fill="#828C9A"></rect>
          </g>
        </svg>
      </span>
      <div v-if="isCounting && !doneCounting" class="record-coutdown">
        <span>{{ count }}</span>
      </div>
      <div v-if="doneRecording"
        class="absolute left-0 bottom-[120px] w-full flex justify-center items-center z-50 flex-col">
        <span class="text-xl lg:text-2xl text-white font-medium mb-6">Do you confirm the recording?</span>
        <div class="w-full flex justify-center items-center">
          <router-link to="/">
            <button
              class="bg-[#FF5757] w-[90px] h-[90px] lg:w-[138px] lg:h-[138px] rounded-full flex justify-center items-center opacity-70 hover:opacity-100">
              <svg width="60" height="60" class="w-[45px] h-[45px] lg:w-[60px] lg:h-[60px]" viewBox="0 0 60 60"
                fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M56.9997 56.9997L29.9999 29.9999ZM29.9999 29.9999L3 3ZM29.9999 29.9999L57 3ZM29.9999 29.9999L3 57Z"
                  fill="#FF5757">
                </path>
                <path d="M56.9997 56.9997L29.9999 29.9999M29.9999 29.9999L3 3M29.9999 29.9999L57 3M29.9999 29.9999L3 57"
                  stroke="white" stroke-width="5.99997" stroke-linecap="round" stroke-linejoin="round">
                </path>
              </svg>
            </button>
          </router-link>
          <button @click="saveVideo"
            class="bg-[#5EDE99] w-[90px] h-[90px] lg:w-[138px] lg:h-[138px] rounded-full flex justify-center items-center opacity-70 hover:opacity-100 ml-6"
            type="button" label="İleri" icon="pi pi-search">

            <svg v-if="!uploadDone" width="200px" height="200px" xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid"
              class="selectButtonIcon" style="background: none;">
              <circle cx="75" cy="50" fill="#fff" r="6.39718">
                <animate attributeName="r" values="4.8;4.8;8;4.8;4.8" times="0;0.1;0.2;0.3;1" dur="1s"
                  repeatCount="indefinite" begin="-0.875s"></animate>
              </circle>
              <circle cx="67.678" cy="67.678" fill="#fff" r="4.8">
                <animate attributeName="r" values="4.8;4.8;8;4.8;4.8" times="0;0.1;0.2;0.3;1" dur="1s"
                  repeatCount="indefinite" begin="-0.75s"></animate>
              </circle>
              <circle cx="50" cy="75" fill="#fff" r="4.8">
                <animate attributeName="r" values="4.8;4.8;8;4.8;4.8" times="0;0.1;0.2;0.3;1" dur="1s"
                  repeatCount="indefinite" begin="-0.625s"></animate>
              </circle>
              <circle cx="32.322" cy="67.678" fill="#fff" r="4.8">
                <animate attributeName="r" values="4.8;4.8;8;4.8;4.8" times="0;0.1;0.2;0.3;1" dur="1s"
                  repeatCount="indefinite" begin="-0.5s"></animate>
              </circle>
              <circle cx="25" cy="50" fill="#fff" r="4.8">
                <animate attributeName="r" values="4.8;4.8;8;4.8;4.8" times="0;0.1;0.2;0.3;1" dur="1s"
                  repeatCount="indefinite" begin="-0.375s"></animate>
              </circle>
              <circle cx="32.322" cy="32.322" fill="#fff" r="4.80282">
                <animate attributeName="r" values="4.8;4.8;8;4.8;4.8" times="0;0.1;0.2;0.3;1" dur="1s"
                  repeatCount="indefinite" begin="-0.25s"></animate>
              </circle>
              <circle cx="50" cy="25" fill="#fff" r="6.40282">
                <animate attributeName="r" values="4.8;4.8;8;4.8;4.8" times="0;0.1;0.2;0.3;1" dur="1s"
                  repeatCount="indefinite" begin="-0.125s"></animate>
              </circle>
              <circle cx="67.678" cy="32.322" fill="#fff" r="7.99718">
                <animate attributeName="r" values="4.8;4.8;8;4.8;4.8" times="0;0.1;0.2;0.3;1" dur="1s"
                  repeatCount="indefinite" begin="0s"></animate>
              </circle>
            </svg>

            <svg v-else width="62" height="45" class="w-[52px] h-[30px] lg:w-[62px] lg:h-[45px]" viewBox="0 0 62 45"
              fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 24.4067L20.2308 41.5321L59 3" fill="#5EDE99"></path>
              <path d="M3 24.4067L20.2308 41.5321L59 3" stroke="white" stroke-width="6" stroke-linecap="round"
                stroke-linejoin="round"></path>
            </svg></button>
        </div>
      </div>

      <transition name="fade">
        <div v-if="openedSettings"
          class="bg-white flex justify-center items-center flex-col w-[90%] absolute top-[calc(50%-60px)] z-50 p-4 left-[5%] rounded-lg">
          <div class="p-dropdown p-component p-inputwrapper w-full" data-pc-name="dropdown" data-pc-section="root"
            id="pv_id_3">
            <span v-if="!selectedCamera" class="p-dropdown-label p-inputtext p-placeholder" tabindex="0" role="combobox"
              aria-label="Camera" aria-haspopup="listbox" aria-expanded="false" aria-controls="pv_id_3_list"
              aria-disabled="false" data-pc-section="input">Camera</span>
            <select v-model="selectedCamera" class="p-dropdown-menu w-full">
              <option v-for="camera in cameras" :key="camera.deviceId" :value="camera.deviceId">
                {{ camera.label || 'Camera ' + (index + 1) }}
              </option>
            </select>
          </div>

          <div class="p-dropdown p-component p-inputwrapper w-full mt-2" data-pc-name="dropdown" data-pc-section="root"
            id="pv_id_4">
            <span v-if="!selectedMicrophone" class="p-dropdown-label p-inputtext p-placeholder" tabindex="0"
              role="combobox" aria-label="Microphone" aria-haspopup="listbox" aria-expanded="false"
              aria-controls="pv_id_4_list" aria-disabled="false" data-pc-section="input">Microphone</span>
            <select v-model="selectedMicrophone" class="p-dropdown-menu w-full">
              <option v-for="mic in microphones" :key="mic.deviceId" :value="mic.deviceId">
                {{ mic.label || 'Microphone ' + (index + 1) }}
              </option>
            </select>
          </div>
          <div class="mt-4 flex justify-center items-center w-full"><button @click="openedSettings = false"
              class="flex w-[100px] items-center justify-center gap-2 rounded-md bg-dark py-1.5 text-sm font-semibold text-white duration-200 ease-in hover:opacity-70">Cancel</button><button @click="getMediaStream"
              class="flex w-[100px] items-center justify-center gap-2 rounded-md bg-primary py-1.5 text-sm font-semibold text-white duration-200 ease-in hover:opacity-70 ml-2">Apply</button>
          </div>
        </div>
      </transition>

      <transition name="fade">
        <div v-if="isLoading"
          class="absolute left-0 top-0 bg-black w-full h-full z-50 flex justify-center items-center">
          <div class="flex justify-center items-center flex-col">
            <div class="w-[70px]"><svg class="spinner" xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 320 320" width="320" height="320"
                preserveAspectRatio="xMidYMid meet"
                style="width: 100%; height: 100%; transform: translate3d(0px, 0px, 0px); content-visibility: visible;">
                <defs>
                  <clipPath id="__lottie_element_14291">
                    <rect width="320" height="320" x="0" y="0"></rect>
                  </clipPath>
                  <clipPath id="__lottie_element_14293">
                    <path d="M0,0 L100000,0 L100000,100000 L0,100000z"></path>
                  </clipPath>
                  <clipPath id="__lottie_element_14297">
                    <path d="M0,0 L100000,0 L100000,100000 L0,100000z"></path>
                  </clipPath>
                  <clipPath id="__lottie_element_14304">
                    <path d="M0,0 L100000,0 L100000,100000 L0,100000z"></path>
                  </clipPath>
                  <clipPath id="__lottie_element_14311">
                    <path d="M0,0 L100000,0 L100000,100000 L0,100000z"></path>
                  </clipPath>
                  <clipPath id="__lottie_element_14315">
                    <path d="M0,0 L100000,0 L100000,100000 L0,100000z"></path>
                  </clipPath>
                </defs>
                <g clip-path="url(#__lottie_element_14291)">
                  <g id="precomp_HFbiRuIJ99_FkR_5sHR4e0" clip-path="url(#__lottie_element_14293)"
                    transform="matrix(1,0,0,1,-49840,-49840)" opacity="1" style="display: block;">
                    <g id="precomp_JYi8e6N311wTPPDUcVsnU6" clip-path="url(#__lottie_element_14315)"
                      transform="matrix(1,0,0,1,0,0)" opacity="1" style="display: block;"></g>
                    <g id="precomp_rCGt2atJzHbK0KUK7h4p45" clip-path="url(#__lottie_element_14311)"
                      transform="matrix(1,0,0,1,0,0)" opacity="1" style="display: block;"></g>
                    <g id="precomp_Rf9k9UFS_RAnOd29e1Ma43" clip-path="url(#__lottie_element_14304)"
                      transform="matrix(1,0,0,1,0,0)" opacity="0.2" style="display: block;">
                      <g id="D1SSmsWuAiwEF1MDxKUYL4" transform="matrix(1,0,0,1,50000,50000)" opacity="1"
                        style="display: block;">
                        <g opacity="1" transform="matrix(1,0,0,1,0,0)">
                          <path fill="rgb(255,255,255)" fill-opacity="1"
                            d=" M70.5,0 C70.5,-38.939998626708984 38.939998626708984,-70.5 0,-70.5 C-38.939998626708984,-70.5 -70.5,-38.939998626708984 -70.5,0 C-70.5,38.939998626708984 -38.939998626708984,70.5 0,70.5 C38.939998626708984,70.5 70.5,38.939998626708984 70.5,0 M100,0 C100,55.22999954223633 55.22999954223633,100 0,100 C-55.22999954223633,100 -100,55.22999954223633 -100,0 C-100,-55.22999954223633 -55.22999954223633,-100 0,-100 C55.22999954223633,-100 100,-55.22999954223633 100,0">
                          </path>
                        </g>
                      </g>
                    </g>
                    <g id="precomp_k8vW8VHNJZc8EteVBFU061" clip-path="url(#__lottie_element_14297)"
                      transform="matrix(0.7187418341636658,-0.6952770352363586,0.6952770352363586,0.7187418341636658,-20700.9453125,48826.7578125)"
                      opacity="1" style="display: block;">
                      <g id="RdgxJpYmQDnKkfSxL5Ai42" transform="matrix(1,0,0,1,50000,50000)" opacity="1"
                        style="display: block;">
                        <g opacity="1" transform="matrix(1,0,0,1,0,0)">
                          <path fill="rgb(255,255,255)" fill-opacity="1"
                            d=" M0,-100 C0,-100 0,-100 0,-100 C0,-100 0,-100 0,-100 C0,-100 0,-100 0,-100 C0,-100 0,-100 0,-100 M0,-100 C55.189998626708984,-100 100,-55.189998626708984 100,0 C100,0 70.5,0 70.5,0 C70.5,-38.939998626708984 38.939998626708984,-70.5 0,-70.5 C0,-70.5 0,-100 0,-100">
                          </path>
                        </g>
                      </g>
                    </g>
                  </g>
                </g>
              </svg></div>
            <p class="text-gray-3">Camera Connecting...</p>
          </div>
        </div>
      </transition>

    </div>
  </div>

</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useWebSocket } from "../composables/useWebSocket";
import { useUpload } from "../composables/useUpload";
import adapter from "webrtc-adapter";
import axios from 'axios';



const cameras = ref([]);
const microphones = ref([]);
const selectedCamera = ref('');
const selectedMicrophone = ref('');
const video = ref(null);
const recordedvideo = ref(null);
const mediaRecorder = ref(null);
const recordedBlob = ref(null);
const description = ref("");
const isRecording = ref(false);
const doneRecording = ref(false);
const uploadProgress = ref(0);
const compressionProgress = ref(0);
const startTime = ref(null);
const stopTime = ref(null);
const duration = ref(0);
const clientId = ref(null);
const uploadDone = ref(false);
const count = ref(4);
const isCounting = ref(false);
const doneCounting = ref(false);
const displayRecordingTime = ref("00");
const allowedToPause = ref(false);
const openedSettings = ref(false);
const compressionComplete = ref(false);
const recordedVideoPaused = ref(false);
const isLoading = ref(true);
const videoPath = ref("");
const displayVideo = ref("");
const SERVER = import.meta.env.VITE_CONNECTION_LINK



let stream;

const router = useRouter();
const { socket, setupWebSocketEvents } = useWebSocket();
const { uploadBlobs, finalizeUpload, isUploadDone } = useUpload({
  clientId,
  description,
  uploadProgress,
  compressionProgress,
  duration,
  startTime,
  stopTime,
  video,
  router,
});

setupWebSocketEvents(socket, {
  clientId,
  uploadProgress,
  compressionProgress,
  duration,
  compressionComplete,
  videoPath,
  displayVideo
});

watch(compressionComplete, (newVal) => {
  if (newVal) {
    uploadDone.value = true;
  }
});

const startRecordedVideo = () => {
  recordedvideo.value.currentTime = 0;
  recordedvideo.value.play();
}
const togglePlayPause = () => {
  if (recordedvideo.value.paused) {
    recordedvideo.value.play();
  } else {
    recordedvideo.value.pause();
    recordedvideo.value.currentTime = 0;
  }
}

const pauseRecordingHandler = () => {
  if (allowedToPause.value) {
    stopRecording()
  }
}

const recordTimer = async () => {
  let recordingTime = 0;
  let countInterval = setInterval(() => {
    recordingTime += 1;
    displayRecordingTime.value = String(recordingTime).padStart(2, '0')
    if (recordingTime == 5) {
      allowedToPause.value = true;
    }
    else if (!isRecording.value) {
      clearInterval(countInterval)
    }
    else if (recordingTime == 30) {
      stopRecording();
      clearInterval(countInterval)
    }
  }, 1000)
}

const countDown = async () => {
  if (isCounting.value) {
    count.value = 3;
    return
  }
  let countInterval = setInterval(async () => {
    isCounting.value = true;
    --count.value;
    if (!count.value) {
      startMediaRecorder();
      clearInterval(countInterval)
      doneCounting.value = true;
      await recordTimer();
    }
  }, 1000)
};

const startRecording = async () => {
  stream = await getMediaStream();
  initializeMediaRecorder(stream);
  //startMediaRecorder();
};

const stopRecording = async () => {
  mediaRecorder.value.stop();
  isRecording.value = false;
  sendRecordingStopped();
  stopStream();
};

const stopStream = async () => {
  stream.getTracks()
    .forEach(track => track.stop());
}

const sendRecordingDone = async () => {
  try {
    await axios.post(`${SERVER}/done`, {
      description: description.value,
      clientId: clientId.value,
    });
  } catch (error) {
    console.error(error);
  }
}

const sendRecordingStopped = async () => {
  const doneRecordingInterval = setInterval(() => {
    if (isUploadDone()) {
      clearInterval(doneRecordingInterval);
      sendRecordingDone()
    }
  }, 3000);

}



const saveVideo = async () => {
  if (uploadDone.value) {
    await finalizeUpload(videoPath);
  }
};

const isMobile = () => {
  return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
}

const getMediaStream = async (selectedCameraSource=selectedCameraSource.value, selectedMicSource=selectedMicSource.value) => {
  const constraints = {
    audio: selectedMicSource ? { deviceId: { exact: selectedMicSource }, sampleRate: 48000, channelCount: 2, volume: 1.0 } : true,
    video: selectedCameraSource ? { deviceId: { exact: selectedCameraSource } } : {}
  };

  if (isMobile()) {
    constraints.video = {
      ...constraints.video,
      width: { exact: 720 },
      frameRate: 24
    };
  } else {
    constraints.video = {
      ...constraints.video,
      width: { exact: 1280 },
      height: { exact: 720 },
      frameRate: 24
    };
  }

  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err) {
    console.error('Error accessing media devices.', err);
    throw err;
  }
};



const initializeMediaRecorder = (stream) => {
  video.value.srcObject = stream;
  mediaRecorder.value = new MediaRecorder(stream);
  mediaRecorder.value.ondataavailable = handleDataAvailable;
  mediaRecorder.value.onstart = handleStart;
  mediaRecorder.value.onstop = handleStop;
  isLoading.value = false;
};

const startMediaRecorder = () => {
  mediaRecorder.value.start(500);
  isRecording.value = true;
};

const handleDataAvailable = async (event) => {
  if (event.data.size > 0) {
    await uploadBlobs(event.data);
  }
};

const handleStart = () => {
  startTime.value = Date.now();
};

const handleStop = async () => {
  recordedBlob.value = true;
  stopTime.value = Date.now();
  duration.value += Math.round((stopTime.value - startTime.value) / 1000);
  doneRecording.value = true;
  await uploadBlobs();

};

router.beforeEach((to, from, next) => {
  handleRouteChange(from, to);
  next();
});

const handleRouteChange = (from, to) => {
  if (from.path === "/record-videos" && to.path !== "/record-videos") {
    socket.disconnect();
    if (mediaRecorder.value) {
      mediaRecorder.value.stop();
      stopStream();
    }
  }
};

onMounted(async () => {
  console.log("WebRTC adapter.js loaded:", adapter.browserDetails.browser);
  startRecording();
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    cameras.value = devices.filter(device => device.kind === 'videoinput');
    microphones.value = devices.filter(device => device.kind === 'audioinput');
  } catch (error) {
    console.error('Error accessing media devices:', error);
  }
});
</script>