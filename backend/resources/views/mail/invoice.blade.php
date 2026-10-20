@php
    $teal = '#1b4d48';
    $muted = '#5b6765';
    $border = '#e3e3dd';
    $td = "padding:10px 8px;border-bottom:1px solid {$border};font-size:14px;";
@endphp
<!doctype html>
<html>
<body style="margin:0;background:#f4f6f8;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#16201f">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#fff;border:1px solid {{ $border }};border-radius:12px">
    <tr><td style="padding:32px 32px 8px">
        @if (trim($note) !== '')
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6">{!! nl2br(e($note)) !!}</p>
        @endif
        <table role="presentation" width="100%"><tr>
            <td style="vertical-align:top">
                <div style="font-family:Georgia,serif;font-size:24px">{{ $invoice->business_name }}</div>
                <div style="margin-top:6px;font-size:13px;color:{{ $muted }};line-height:1.5">
                    {!! nl2br(e($invoice->business_address)) !!}@if ($invoice->business_email)<br>{{ $invoice->business_email }}@endif
                </div>
            </td>
            <td style="vertical-align:top;text-align:right">
                <div style="font-family:Georgia,serif;font-size:30px;letter-spacing:2px;color:{{ $teal }}">INVOICE</div>
                <table role="presentation" align="right" style="margin-top:8px;font-size:13px">
                    @foreach ($meta as [$label, $value])
                        <tr><td style="color:{{ $muted }};padding:1px 12px 1px 0;text-align:right">{{ $label }}</td><td style="text-align:right;font-weight:600">{{ $value }}</td></tr>
                    @endforeach
                </table>
            </td>
        </tr></table>
    </td></tr>
    <tr><td style="padding:16px 32px">
        <div style="font-size:11px;letter-spacing:1.5px;font-weight:700;color:{{ $teal }}">BILL TO</div>
        <div style="margin-top:6px;font-weight:600">{{ $invoice->customer_name }}</div>
        <div style="font-size:13px;color:{{ $muted }};line-height:1.5">{!! nl2br(e($invoice->customer_address)) !!}</div>
    </td></tr>
    <tr><td style="padding:8px 32px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr style="background:#eef4f2;color:{{ $teal }};font-size:11px;letter-spacing:1px">
                <th align="left" style="padding:8px">#</th><th align="left" style="padding:8px">DESCRIPTION</th>
                <th align="right" style="padding:8px">QTY</th><th align="right" style="padding:8px">UNIT PRICE</th><th align="right" style="padding:8px">AMOUNT</th>
            </tr>
            @foreach ($lines as $i => $line)
                <tr>
                    <td style="{{ $td }}color:{{ $muted }}">{{ $i + 1 }}</td>
                    <td style="{{ $td }}">{{ $line['description'] }}</td>
                    <td style="{{ $td }}text-align:right">{{ $line['quantity'] }}</td>
                    <td style="{{ $td }}text-align:right">{{ $line['unitPrice'] }}</td>
                    <td style="{{ $td }}text-align:right">{{ $line['amount'] }}</td>
                </tr>
            @endforeach
        </table>
    </td></tr>
    <tr><td style="padding:8px 32px 24px">
        <table role="presentation" align="right" cellpadding="0" cellspacing="0" style="width:260px;font-size:14px">
            @foreach ($summary as $label => $value)
                <tr><td style="color:{{ $muted }};padding:4px 8px">{{ $label }}</td><td align="right" style="padding:4px 8px">{{ $value }}</td></tr>
            @endforeach
            <tr>
                <td style="background:#eef4f2;color:{{ $teal }};font-weight:700;padding:12px 8px;border-radius:8px 0 0 8px">TOTAL DUE</td>
                <td align="right" style="background:#eef4f2;color:{{ $teal }};font-weight:700;font-size:20px;padding:12px 8px;border-radius:0 8px 8px 0">{{ $total }}</td>
            </tr>
        </table>
    </td></tr>
    @if (trim($invoice->notes) !== '')
        <tr><td style="padding:0 32px 24px;font-size:13px;color:{{ $muted }};line-height:1.6"><strong style="color:{{ $teal }}">Notes</strong><br>{!! nl2br(e($invoice->notes)) !!}</td></tr>
    @endif
    <tr><td style="padding:0 32px 32px"><a href="{{ $viewUrl }}" style="display:inline-block;background:{{ $teal }};color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;font-size:14px">View invoice online</a></td></tr>
</table>
</td></tr></table>
</body>
</html>
