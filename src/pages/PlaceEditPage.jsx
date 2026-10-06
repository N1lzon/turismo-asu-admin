import { useParams, useNavigate } from 'react-router-dom'
import PlaceEditForm from './PlaceEditForm'

export default function PlaceEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  return (
    <PlaceEditForm
      id={id}
      onBack={() => navigate('/lugares')}
      onDeleted={() => navigate('/lugares', { replace: true })}
    />
  )
}
