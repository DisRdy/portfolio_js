<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dr</title>
    <link rel="icon" href="{{ asset('img/LOGODR.png') }}" type="image/png">
    @vite(['resources/css/app.css', 'resources/js/app.js'])

</head>

<body>
    <x-public-navbar />
    <header>
        <p class="brand-ts">Hi, Welcome!</p>
    </header>

    <div class="container">
        <section>
            <h2>Me? <span class="brand-ts-2xl">Disna Radita</span></h2>
            <p>My background is in Laravel, with growing focus on penetration testing, and Web3.<br>
                I have experience building web applications with Laravel. Now I'm also expanding my knowledge in Web3.
            </p>
        </section>

        <section>
            <h2>Technical Skills</h2>
            <div class="skills-list">
                <div class="skill-item">
                    <strong>None</strong>
                    <p>Huftssss</p>
                </div>
                <div class="skill-item">
                    <strong>None</strong>
                    <p>Huftssss</p>
                </div>
                <div class="skill-item">
                    <strong>None</strong>
                    <p>Huftssss</p>
                </div>
            </div>
        </section>

        <section>
            <h2>Experience</h2>
            <p>I've worked on a variety of projects, from small applications to more complex systems. This experience
                has taught me the importance of clean code and documentation.</p>
            <ul>
                <li>Been a driver at FinExpress for 3 years (Work)</li>
                <li>Make a full-stack web applications with Laravel (Project)</li>
                <li>Database design and optimization (Project)</li>
            </ul>
        </section>

        <section id="skills">
            <h2>Skills</h2>
            <ul>
                <li>Linux Tools</li>
                <li>Penetration Testing</li>
                <li>Web Dev</li>
                <li>IT Support</li>
            </ul>
        </section>

        <!-- <section>
            <h2>Any</h2>
            <p>Big money never comes clean</p>
        </section> -->

        <section id="contact">
            <h2>Contact</h2>
            <p>If you're interested in collaborating or just want to say hello, feel free to reach out to me:</p>
            <p>
                Email: <a href="mailto:disnaraditya@gmail.com">disnaraditya@gmail.com</a><br>
                GitHub: <a href="https://github.com/DisRdy" target="_blank">My github</a><br>
                Dev: <a href="https://dev.to/lamp" target="_blank">Dev community</a> <br>
                Instagram: <a href="https://www.instagram.com/dsnardy?igsh=bDNubXduNmNsYTM1" target="_blank">My
                    Instagram</a>
            </p>
        </section>
    </div>

    <footer>
        <p>&copy; 2025 Dr</p>
    </footer>
</body>

</html>