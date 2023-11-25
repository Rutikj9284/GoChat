import React from 'react'

function Avatar({username, userId, online}) {
  return (
    <div className='w-8 relative h-8 bg-green-200 rounded-full flex items-center'>
        <div className='text-center w-full text-black-700 opacity-60'>{username[0]}</div>
        {/* If online then show blue dot */}
        {online && (
          <div className='absolute w-2 h-2 bg-blue-700 bottom-0 right-1 rounded border border-white'></div>
        )}
    </div>
  )
}

export default Avatar