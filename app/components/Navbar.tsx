import { FaCoffee } from 'react-icons/fa';

<Link 
  href={`https://www.buymeacoffee.com/${process.env.NEXT_PUBLIC_BUYMEACOFFEE_USERNAME}`}
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
>
  <FaCoffee className="w-5 h-5" />
  <span>Buy me a coffee</span>
</Link> 