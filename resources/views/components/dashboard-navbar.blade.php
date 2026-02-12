<nav class="kof-navbar dashboard-navbar">
    <div class="navbar-container">
        <!-- Logo / Brand -->
        <div class="navbar-brand">
            <a href="{{ route('dashboard') }}" class="brand-link">
                <span class="brand-text">Dr</span>
            </a>
        </div>

        <!-- Mobile Menu Toggle -->
        <button class="navbar-toggle" id="navToggle" aria-label="Toggle Navigation">
            <span class="toggle-line"></span>
            <span class="toggle-line"></span>
            <span class="toggle-line"></span>
        </button>

        <!-- Navigation Links -->
        <div class="navbar-menu" id="navMenu">

            <!-- Dashboard Link (Active State Logic) -->
            <a href="{{ route('dashboard') }}"
                class="nav-link {{ Request::routeIs('dashboard') && !Request::routeIs('dashboard.blogs*') && !Request::routeIs('dashboard.projects*') ? 'active' : '' }}">
                <span class="nav-text">Dashboard</span>
            </a>

            <!-- Manage Projects Link -->
            <a href="{{ route('dashboard.projects.index') }}"
                class="nav-link {{ Request::routeIs('dashboard.projects*') ? 'active' : '' }}">
                <span class="nav-text">Projects</span>
            </a>

            <!-- Manage Blogs Link -->
            <a href="{{ route('dashboard.blogs.index') }}"
                class="nav-link {{ Request::routeIs('dashboard.blogs*') ? 'active' : '' }}">
                <span class="nav-text">Blogs</span>
            </a>


            <!-- Logout -->
            <form method="POST" action="{{ route('logout') }}" class="nav-link-form">
                @csrf
                <button type="submit" class="nav-link btn-logout-nav">
                    <span class="nav-text">Logout</span>
                </button>
            </form>
        </div>
    </div>

    <!-- Decorative Line -->
    <div class="navbar-line"></div>
</nav>