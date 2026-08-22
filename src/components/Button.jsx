const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
}

const Button = ({ variant = 'primary', className = '', ...props }) => (
  <button className={`${variants[variant]} ${className}`} {...props} />
)

export default Button
