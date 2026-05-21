export function SearchInput({ mobile = false }: { mobile?: boolean }) {
  return (
    <label className={mobile ? 'search-field search-field-mobile' : 'search-field'}>
      <span className="search-icon" aria-hidden="true">⌕</span>
      <input aria-label="Search anime" type="search" placeholder="Search title, studio, or mood" />
    </label>
  );
}
