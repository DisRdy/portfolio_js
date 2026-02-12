<!-- <!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register</title>
    @vite(['resources/css/app.css','resources/js/app.js'])
</head>

<body>
    <div class="container">
        <section class="auth-wrapper">
            <h2>Register</h2>

            <form method="POST" action="{{ route('register.store') }}">
                @csrf

                <div>
                    <label for="name" class="form-group-label">Nama</label>
                    <input type="text" name="name" id="name" value="{{ old('name') }}" required autofocus
                        class="form-input"
                        >
                    @error('name')
                        <span class="text-red-500 text-sm">{{ $message }}</span>
                    @enderror
                </div>

                <div>
                    <label for="email" class="form-group-label"
                        >Email</label>
                    <input type="email" name="email" id="email" value="{{ old('email') }}" required class="form-input"
                        >
                    @error('email')
                        <span class="text-red-500 text-sm">{{ $message }}</span>
                    @enderror
                </div>

                <div>
                    <label for="password" class="form-group-label"
                        >Password</label>
                    <input type="password" name="password" id="password" required class="form-input"
                        >
                    @error('password')
                        <span class="text-red-500 text-sm">{{ $message }}</span>
                    @enderror
                </div>

                <div>
                    <label for="password_confirmation" class="form-group-label"
                        >Konfirmasi Password</label>
                    <input type="password" name="password_confirmation" id="password_confirmation" required
                        class="form-input"
                        >
                </div>

                <button type="submit" class="btn"
                    >
                    Register
                </button>
            </form>

            <p>
                Sudah punya akun? <a href="{{ route('login') }}">Login</a>
            </p>
        </section>
    </div>

    <footer>
        <p>&copy; 2025 Dr</p>
    </footer>
</body>

</html> -->

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HUUU</title>
    <link rel="icon" href="{{ asset('img/LOGODR.png') }}" type="image/png">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>

<body>
    <div class="container">
        <section class="auth-wrapper">
            <h2>Cari Apa Bang?</h2>
    </div>


</body>

</html>