<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title ?? 'Komentar' }}</title>
    <link rel="icon" href="{{ asset('img/LOGODR.png') }}" type="image/png">

</head>

<body>
    <div class="layout-wrapper">
        {{ $slot }}
    </div>
    @livewireScripts
</body>

</html>