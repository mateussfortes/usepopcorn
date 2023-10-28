import { useEffect, useState } from "react";
import StarRating from  "./StarRating";

const KEY = "c656cdc2";

export default function App() {
  const [query, setQuery] = useState("inception");
  const [movies, setMovies] = useState([]);
  const [watched, setWatched] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState();

  function handleSelectMovie(id) {
    setSelectedId((selectedId) => (id === selectedId ? null : id));
  }

  function handleCloseMovie() {
    setSelectedId(null);
  }

  function handleAddWatched(movie) {
    setWatched((watched) => [...watched, movie]);
  }

  function handleDeleteWatched(id) {
    setWatched((watched) => watched.filter((movie) => 
    movie.imdbID !== id));
  }

  useEffect(function() {
    async function fetchMovies() {
      try {
        setIsLoading(true);
        setError(); 
        const res = await fetch(
          `http://www.omdbapi.com/?i=tt3896198&apikey=${KEY}&s=${query}`
        );

        if(!res.ok) 
          throw new Error("Algo está errado");

        const data = await res.json();

        if(data.Response === "False") throw new Error("Filme não encontrado");

        console.log(data);

        if(data.Search) 
          setMovies(data.Search);
        // console.log(data.Search);
        setIsLoading(false);
      } 
      catch(err) {
        console.error(err);
        setError(err.message);
      } 
      finally {
        setIsLoading(false);
      }
    }

    if(query.length < 3) {
      setMovies([]);
      setError('');
      return;
    }

    fetchMovies();
  }, [query]);

  return (
    <>
      <NavBar>
        <Search query={query} setQuery={setQuery} />
        <Numresults movies={movies} />
      </NavBar>
      <Main>
        <Box>
          {isLoading && <Loader/>}
          {!isLoading && !error &&<MovieList movies={movies} onSelectMovie={handleSelectMovie} />}
          {error && <ErrorMessage message={error} />} 
        </Box>

        <Box>
          <>
            {
              selectedId ? 
                <MovieDetails 
                  selectedId={selectedId} 
                  onCloseMovie={handleCloseMovie}
                  onAddWatched={handleAddWatched}
                  watched={watched}
                />
              : 
              <>
                <WatchedSummary watched={watched} />
                <WatchedMoviesList 
                  watched={watched} 
                  onDeleteWatched={handleDeleteWatched}
                />
              </>
            }
          </>
        </Box>
      </Main>
    </>
  );
}

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

function NavBar({children}) {
  return (<nav className="nav-bar">
    <Logo />
    {children}
  </nav>);
}

function Logo() {
  return (<div className="logo">
    <span role="img">🍿</span>
    <h1>usePopcorn</h1>
  </div>);
}

function Search({ query, setQuery }) {
  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}

function Numresults({movies}) {
  return (<p className="num-results">
  Found <strong>{movies.length}</strong> results
</p>);
}

function Main({ children }) {  

  return (<main className="main">
    {children}
    {/* <WatchedBox /> */}
  </main>);
}

function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (<div className="box">
    <button
      className="btn-toggle"
      onClick={() => setIsOpen((open) => !open)}
    >
      {isOpen ? "–" : "+"}
    </button>
    {isOpen && children }
  </div>);
}

function MovieList({ movies, onSelectMovie }) {
  return (<ul className="list list-movies">
  {movies?.map((movie) => (
    <Movie movie={movie} onSelectMovie={onSelectMovie}/>
  ))}
</ul>);
}

function Movie({ movie, onSelectMovie }) {
  return (<li key={movie.imdbID} onClick={ () => onSelectMovie(movie.imdbID) }>
    <img src={movie.Poster} alt={`${movie.Title} poster`} />
    <h3>{movie.Title}</h3>
    <div>
      <p>
        <span>🗓</span>
        <span>{movie.Year}</span>
      </p>
    </div>
  </li>);
}

function MovieDetails({ selectedId, onCloseMovie, onAddWatched, watched }) {
  const [movie, setMovie] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [userRating, setUserRating] = useState('');

  const isWatched = watched.map((movie) => movie.imdbID)
  .includes(selectedId);
  const watchedUserRating = watched.find(movie=>movie.imdbID === selectedId)?.userRating;

  const {
    Title: title,
    Year: year,
    Poster: poster,
    Runtime: runtime,
    imdbRating,
    Plot: plot,
    Released: released,
    Actors: actors,
    Director: director,
    Genre: genre, 
  } = movie;

  function handleAdd() {
    const newWatchedMovie = {
      imdbID: selectedId,
      title,
      year,
      poster,
      imdbRating: Number(imdbRating),
      runtime: Number(runtime.split(" ").at(0)),
      userRating,
    }

    onAddWatched(newWatchedMovie);
    onCloseMovie();
  }

  useEffect(
    function() {
      async function getMovieDetails() {
        setIsLoading(true);
        const res = await fetch(
          `http://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}`
        );
        const data = await res.json();
        setMovie(data);
        setIsLoading(false);
      }
      getMovieDetails();
    },
    [selectedId]
  )

  useEffect(
    function() {
      if(!title) return;
        document.title = `Movie | ${title}`;

      return function () {
        document.title = "usePopCorn";
      }

    },
    [title]
  )

  return <div className="details">
    {
      isLoading ? <Loader /> :
      (<>
        <header>
          <button className="btn-back" onClick={onCloseMovie}>&larr;</button>
          <img src={poster} alt={`Poster do filme ${movie}`} />
          <div className="details-overview">
            <h2>{title}</h2>
            <p>{released}</p>
            <p>{genre}</p>
            <p>
              <span>⭐</span>
              {imdbRating} IMDb rating
            </p>
          </div>
        </header>
        <section>
          <div className="rating">
            {!isWatched ?
              <>
                <StarRating maxRating={10} size={24} onSetRating={setUserRating} />
                {userRating > 0 && (
                  <button 
                    className="btn-add" 
                    onClick={handleAdd}
                  >+ filme</button>
                )}
              </>
            :
                  <p>Você já avaliou esse filme com {watchedUserRating} ⭐</p>
            }
          </div>
          <p>
            <em>{plot}</em>
          </p>
          <p>Starring {actors}</p>
          <p>Directed by {director}</p>

        </section>
      </>)
    }
  </div>
}

// function WatchedBox() {
//   const [isOpen2, setIsOpen2] = useState(true);


//   return (<div className="box">
//   <button
//     className="btn-toggle"
//     onClick={() => setIsOpen2((open) => !open)}
//   >
//     {isOpen2 ? "–" : "+"}
//   </button>
//   {isOpen2 && (
//     
//   )}
// </div>);
// }

function WatchedSummary({ watched }) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));

  return (<div className="summary">
  <h2>Movies you watched</h2>
  <div>
    <p>
      <span>#️⃣</span>
      <span>{watched.length} movies</span>
    </p>
    <p>
      <span>⭐️</span>
      <span>{avgImdbRating.toFixed(2)}</span>
    </p>
    <p>
      <span>🌟</span>
      <span>{avgUserRating.toFixed(2)}</span>
    </p>
    <p>
      <span>⏳</span>
      <span>{avgRuntime} min</span>
    </p>
  </div>
</div>);
}

function WatchedMoviesList({watched, onDeleteWatched}) {
  return (<ul className="list">
  {watched.map((movie) => (
    <li key={movie.imdbID}>
      <img src={movie.poster} alt={`${movie.title} poster`} />
      <h3>{movie.title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.runtime} min</span>
        </p>
        <button 
          className="btn-delete" 
          onClick={() => onDeleteWatched(movie.imdbID)}
        >x</button>
      </div>
    </li>
  ))}
</ul>);
}

function Loader() {
  return <p className="loader">Loading...</p>
}

function ErrorMessage({message}) {
    return (
      <p className="error">
        <span>⛔</span> {message}
      </p>
    )
}
 