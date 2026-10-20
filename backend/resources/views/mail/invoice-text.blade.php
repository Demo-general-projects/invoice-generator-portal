@if (trim($note) !== '')
{!! $note !!}

@endif
Invoice {!! $invoice->number !!} from {!! $invoice->business_name !!}
@foreach ($meta as [$label, $value])
{!! $label !!}: {!! $value !!}
@endforeach
Bill to: {!! $invoice->customer_name !!}

@foreach ($lines as $i => $line)
{{ $i + 1 }}. {!! $line['description'] !!} — {{ $line['quantity'] }} × {{ $line['unitPrice'] }} = {{ $line['amount'] }}
@endforeach

@foreach ($summary as $label => $value)
{!! $label !!}: {!! $value !!}
@endforeach
Total due: {{ $total }}
@if (trim($invoice->notes) !== '')

Notes: {!! $invoice->notes !!}
@endif

View online: {!! $viewUrl !!}
