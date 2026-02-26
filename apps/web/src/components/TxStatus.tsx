interface TxStatusProps {
  hash?: string;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error?: Error | null;
}

export function TxStatus({ hash, isPending, isConfirming, isSuccess, error }: TxStatusProps) {
  if (error) {
    return (
      <div className="alert alert-error">
        {error.message.includes('User rejected')
          ? 'Transaction rejected by user'
          : error.message.length > 120
            ? error.message.slice(0, 120) + '...'
            : error.message}
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="alert alert-info">
        <span className="spinner" /> Waiting for wallet confirmation...
      </div>
    );
  }

  if (isConfirming && hash) {
    return (
      <div className="alert alert-info">
        <span className="spinner" /> Transaction submitted. Waiting for confirmation...
        <div className="tx-hash mt-1">{hash}</div>
      </div>
    );
  }

  if (isSuccess && hash) {
    return (
      <div className="alert alert-success">
        Transaction confirmed!
        <div className="tx-hash mt-1">{hash}</div>
      </div>
    );
  }

  return null;
}
